import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import { initI18n } from '~/i18n';
import { AppUpdater } from './appupdater';

describe('AppUpdater', () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(autoUpdater.checkForUpdates).mockReset();
    vi.mocked(Notification).mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test('does not start a second update check while one is pending', async () => {
    let resolveCheck!: (value: unknown) => void;
    vi.mocked(autoUpdater.checkForUpdates).mockReturnValue(
      new Promise<unknown>((resolve) => {
        resolveCheck = resolve;
      }) as ReturnType<typeof autoUpdater.checkForUpdates>,
    );

    const browser = { eventsChannel: { emit: vi.fn() } } as never;
    const updater = new AppUpdater(browser);

    updater.checkForUpdates();
    updater.checkForUpdates();

    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
    expect(updater.isChecking).toBe(true);

    resolveCheck(undefined);
    await Promise.resolve();

    expect(updater.isChecking).toBe(false);
  });

  test('allows a subsequent update check after a rejection', async () => {
    let rejectCheck!: (reason?: unknown) => void;
    vi.mocked(autoUpdater.checkForUpdates).mockReturnValueOnce(
      new Promise<unknown>((_resolve, reject) => {
        rejectCheck = reject;
      }) as ReturnType<typeof autoUpdater.checkForUpdates>,
    );

    const browser = { eventsChannel: { emit: vi.fn() } } as never;
    const updater = new AppUpdater(browser);

    updater.checkForUpdates();
    expect(updater.isChecking).toBe(true);

    rejectCheck(new Error('network failure'));
    await Promise.resolve();

    expect(updater.isChecking).toBe(false);

    updater.checkForUpdates();
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(2);
  });

  test('notifies when a manual update check finds no update', async () => {
    vi.mocked(autoUpdater.checkForUpdates).mockResolvedValue(null);
    const browser = { eventsChannel: { emit: vi.fn() } } as never;
    const updater = new AppUpdater(browser);

    updater.checkForUpdates(true);
    await Promise.resolve();

    expect(Notification).toHaveBeenCalledWith({
      title: 'Updates',
      body: 'No updates are available.',
    });
  });

  test('does not notify when the startup update check finds no update', async () => {
    vi.mocked(autoUpdater.checkForUpdates).mockResolvedValue(null);
    const browser = { eventsChannel: { emit: vi.fn() } } as never;
    new AppUpdater(browser);

    vi.advanceTimersByTime(3000);
    await Promise.resolve();

    expect(Notification).not.toHaveBeenCalled();
  });
});
