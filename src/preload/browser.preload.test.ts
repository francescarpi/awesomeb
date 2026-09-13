import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock state captured before the preload module is imported.
const ipcInvoke = vi.fn();
const exposed: Record<string, unknown> = {};

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (key: string, api: unknown) => {
      exposed[key] = api;
    },
    executeInMainWorld: () => undefined,
  },
  ipcRenderer: {
    invoke: ipcInvoke,
    send: vi.fn(),
    on: vi.fn(),
    sendSync: vi.fn(),
  },
}));

// Helper: reload the preload module to get a fresh module-level i18nBundle
// state. The abI18n object captures its exposed API at import time.
async function loadPreload(): Promise<void> {
  vi.resetModules();
  for (const key of Object.keys(exposed)) delete exposed[key];
  ipcInvoke.mockReset();
  await import('./browser.preload');
  // i18n api is exposed under 'abI18n' — see the bottom of browser.preload.ts.
  if (!exposed.abI18n) {
    throw new Error('abI18n was not exposed by the preload module');
  }
}

function abI18n(): {
  t: (params: object, keys: { key: string; params?: object }[]) => Promise<Record<string, string>>;
} {
  return exposed.abI18n as never;
}

function makeBundle(locale = 'en'): {
  locale: string;
  namespaces: Record<string, Record<string, unknown>>;
} {
  return {
    locale,
    namespaces: {
      pages: {
        history: { title: 'History', searchPlaceholder: 'Search in history...' },
      },
      common: {
        ok: 'OK',
        cancel: 'Cancel',
        greeting: 'Hello {{name}}',
      },
    },
  };
}

describe('preload i18n glue (abI18n.t)', () => {
  beforeEach(async () => {
    await loadPreload();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('first call fetches the bundle via i18n:get-bundle and caches it', async () => {
    const bundle = makeBundle();
    ipcInvoke.mockImplementation((channel: string) => {
      if (channel === 'i18n:get-bundle') return Promise.resolve(bundle);
      if (channel === 'i18n:t') return Promise.resolve({});
      return Promise.resolve();
    });

    const result = await abI18n().t({}, [{ key: 'pages:history.title' }]);

    expect(result['pages:history.title']).toBe('History');
    expect(ipcInvoke).toHaveBeenCalledWith('i18n:get-bundle', expect.objectContaining({}));
    // bundle hit → i18n:t NOT called
    expect(ipcInvoke).not.toHaveBeenCalledWith('i18n:t', expect.anything());
  });

  it('second call reuses the cached bundle, no additional i18n:get-bundle IPC', async () => {
    const bundle = makeBundle();
    let bundleCalls = 0;
    ipcInvoke.mockImplementation((channel: string) => {
      if (channel === 'i18n:get-bundle') {
        bundleCalls++;
        return Promise.resolve(bundle);
      }
      return Promise.resolve({});
    });

    await abI18n().t({}, [{ key: 'pages:history.title' }]);
    await abI18n().t({}, [{ key: 'pages:history.searchPlaceholder' }]);

    expect(bundleCalls).toBe(1);
  });

  it('keys missing from the bundle fall back to the per-key i18n:t IPC', async () => {
    const bundle = makeBundle();
    ipcInvoke.mockImplementation((channel: string, args: { keys: { key: string }[] }) => {
      if (channel === 'i18n:get-bundle') return Promise.resolve(bundle);
      if (channel === 'i18n:t') {
        // Echo the requested keys with a 'via-fallback' suffix so we can
        // prove the fallback path actually ran.
        const result: Record<string, string> = {};
        for (const k of args.keys) result[k.key] = `${k.key}::via-fallback`;
        return Promise.resolve(result);
      }
      return Promise.resolve();
    });

    const result = await abI18n().t({}, [{ key: 'menu:app.about' }]);

    expect(result['menu:app.about']).toBe('menu:app.about::via-fallback');
  });

  it('breaker: after 3 consecutive bundle failures, every key goes to i18n:t and no more bundle IPC is attempted', async () => {
    let bundleCalls = 0;
    ipcInvoke.mockImplementation((channel: string) => {
      if (channel === 'i18n:get-bundle') {
        bundleCalls++;
        return Promise.reject(new Error('boom'));
      }
      if (channel === 'i18n:t') return Promise.resolve({ 'menu:app.about': 'from-fallback' });
      return Promise.resolve();
    });

    // First 3 calls: bundle fails, falls back to i18n:t.
    await abI18n().t({}, [{ key: 'menu:app.about' }]);
    await abI18n().t({}, [{ key: 'menu:app.about' }]);
    await abI18n().t({}, [{ key: 'menu:app.about' }]);
    expect(bundleCalls).toBe(3);

    // 4th call: breaker is open, no bundle IPC, all keys go to i18n:t.
    const result = await abI18n().t({}, [{ key: 'menu:app.about' }]);
    expect(bundleCalls).toBe(3);
    expect(result['menu:app.about']).toBe('from-fallback');
  });

  it('short key (no namespace) resolves from the common namespace via the bundle', async () => {
    const bundle = makeBundle();
    ipcInvoke.mockImplementation((channel: string) => {
      if (channel === 'i18n:get-bundle') return Promise.resolve(bundle);
      return Promise.resolve({});
    });

    const result = await abI18n().t({}, [
      { key: 'ok' },
      { key: 'greeting', params: { name: 'World' } },
    ]);

    expect(result.ok).toBe('OK');
    expect(result.greeting).toBe('Hello World');
    expect(ipcInvoke).not.toHaveBeenCalledWith('i18n:t', expect.anything());
  });

  it('concurrent first calls share a single i18n:get-bundle IPC (deduped promise)', async () => {
    let resolveBundle: (b: unknown) => void = () => undefined;
    const pending = new Promise((res) => {
      resolveBundle = res;
    });
    let bundleCalls = 0;
    ipcInvoke.mockImplementation((channel: string) => {
      if (channel === 'i18n:get-bundle') {
        bundleCalls++;
        return pending;
      }
      return Promise.resolve({});
    });

    const p1 = abI18n().t({}, [{ key: 'pages:history.title' }]);
    const p2 = abI18n().t({}, [{ key: 'pages:history.title' }]);
    const p3 = abI18n().t({}, [{ key: 'pages:history.title' }]);

    // Before resolving, the three concurrent calls must share one IPC.
    expect(bundleCalls).toBe(1);

    resolveBundle(makeBundle());
    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1['pages:history.title']).toBe('History');
    expect(r2['pages:history.title']).toBe('History');
    expect(r3['pages:history.title']).toBe('History');
    expect(bundleCalls).toBe(1);
  });
});
