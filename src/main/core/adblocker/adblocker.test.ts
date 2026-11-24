import { expect, test, describe, vi, beforeEach } from 'vitest';

const {
  enableBlockingInSession,
  disableBlockingInSession,
  fromLists,
  fromPrebuiltAdsAndTracking,
  deserialize,
  fsStat,
  fsReadFile,
  fsWriteFile,
} = vi.hoisted(() => ({
  enableBlockingInSession: vi.fn(),
  disableBlockingInSession: vi.fn(),
  fromLists: vi.fn(),
  fromPrebuiltAdsAndTracking: vi.fn(),
  deserialize: vi.fn(),
  fsStat: vi.fn(),
  fsReadFile: vi.fn(),
  fsWriteFile: vi.fn(),
}));

vi.mock('@ghostery/adblocker-electron', () => ({
  ElectronBlocker: {
    fromLists: (...args: unknown[]) => fromLists(...args),
    fromPrebuiltAdsAndTracking: (...args: unknown[]) => fromPrebuiltAdsAndTracking(...args),
    deserialize: (...args: unknown[]) => deserialize(...args),
  },
  adsAndTrackingLists: ['https://example.test/easylist.txt'],
}));

vi.mock('@/paths', () => ({
  userDataPath: () => '/tmp/awesomeb-adblocker-test',
}));

vi.mock('fs', () => ({
  promises: {
    stat: fsStat,
    readFile: fsReadFile,
    writeFile: fsWriteFile,
  },
}));

import { AdBlocker } from './adblocker';

function makeEngine(): unknown {
  return {
    enableBlockingInSession: (...args: unknown[]) => enableBlockingInSession(...args),
    disableBlockingInSession: (...args: unknown[]) => disableBlockingInSession(...args),
  };
}

function makeSession(name: string): never {
  return { name } as never;
}

describe('AdBlocker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromLists.mockImplementation(() => Promise.resolve(makeEngine()));
    deserialize.mockReturnValue(makeEngine());
    fsStat.mockRejectedValue(new Error('no cache'));
    fsReadFile.mockRejectedValue(new Error('no cache'));
    fsWriteFile.mockResolvedValue(undefined);
  });

  test('enables network blocking in every given session', async () => {
    const adblocker = new AdBlocker();
    const a = makeSession('a');
    const b = makeSession('b');

    await adblocker.init([a, b]);

    expect(enableBlockingInSession).toHaveBeenCalledWith(a);
    expect(enableBlockingInSession).toHaveBeenCalledWith(b);
    expect(adblocker.isBlocking).toBe(true);
  });

  test('builds a network-only engine and a cosmetic-only engine', async () => {
    const adblocker = new AdBlocker();

    await adblocker.init([makeSession('a')]);

    expect(fromLists).toHaveBeenCalledTimes(2);

    const [, , networkConfig] = fromLists.mock.calls[0];
    expect(networkConfig).toEqual({ loadCosmeticFilters: false });

    const [, , cosmeticConfig] = fromLists.mock.calls[1];
    expect(cosmeticConfig).toEqual({ loadNetworkFilters: false });
  });

  test('reuses a cached engine instead of fetching the lists again', async () => {
    fsStat.mockResolvedValue({ mtimeMs: Date.now() });
    fsReadFile.mockResolvedValue(Buffer.from('engine'));

    deserialize.mockReturnValue(makeEngine());

    const adblocker = new AdBlocker();

    await adblocker.init([makeSession('a')]);

    expect(fromLists).not.toHaveBeenCalled();
    expect(deserialize).toHaveBeenCalled();
  });

  test('does not enable the same session twice', async () => {
    const adblocker = new AdBlocker();
    const a = makeSession('a');

    await adblocker.init([a]);
    await adblocker.enable([a]);

    const callsForA = enableBlockingInSession.mock.calls.filter((call) => call[0] === a);
    expect(callsForA.length).toBe(2); // once for network, once for cosmetics
  });

  test('disable removes blocking from the active sessions', async () => {
    const adblocker = new AdBlocker();
    const a = makeSession('a');

    await adblocker.init([a]);
    await adblocker.disable();

    expect(disableBlockingInSession).toHaveBeenCalledWith(a);
    expect(adblocker.isBlocking).toBe(false);
  });

  test('can be re-enabled after being disabled', async () => {
    const adblocker = new AdBlocker();
    const a = makeSession('a');

    await adblocker.init([a]);
    await adblocker.disable();
    await adblocker.enable([a]);

    expect(adblocker.isBlocking).toBe(true);
  });

  test('apply toggles blocking depending on the flag', async () => {
    const adblocker = new AdBlocker();
    const a = makeSession('a');

    await adblocker.apply(true, [a]);
    expect(adblocker.isBlocking).toBe(true);

    await adblocker.apply(false, [a]);
    expect(adblocker.isBlocking).toBe(false);
  });

  test('a failed engine load does not throw and leaves blocking off', async () => {
    fromLists.mockRejectedValue(new Error('offline'));

    const adblocker = new AdBlocker();

    await expect(adblocker.init([makeSession('a')])).resolves.toBeUndefined();
    expect(adblocker.isBlocking).toBe(false);
    expect(enableBlockingInSession).not.toHaveBeenCalled();
  });

  test('a failed engine load does not loop when enabling afterwards', async () => {
    fromLists.mockRejectedValue(new Error('offline'));

    const adblocker = new AdBlocker();

    await adblocker.init([makeSession('a')]);
    await expect(adblocker.enable([makeSession('a')])).resolves.toBeUndefined();
    expect(adblocker.isBlocking).toBe(false);
  });
});
