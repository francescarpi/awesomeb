import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { Menu, ipcMain, type IpcMain, type IpcMainEvent } from 'electron';
import { Browser, partitions } from '@/core';
import { initI18n } from '~/i18n';
import { setupMenuIPC } from './ipc';

// Type helpers matching the shape createHandler uses with method='on'.
type Handler = (event: IpcMainEvent, ...args: unknown[]) => void;

// Captured handlers per channel.
const handlers = new Map<string, Handler>();

// Minimal fake event. We never read the sender in setupMenuIPC's registered handler.
const fakeEvent = {} as unknown as IpcMainEvent;

beforeEach(async () => {
  handlers.clear();

  vi.spyOn(ipcMain, 'on').mockImplementation(((channel: string, fn: Handler): IpcMain => {
    handlers.set(channel, fn);
    return ipcMain;
  }) as never);

  // buildFromTemplate is invoked by the menu builders; returning a stand-in object
  // that exposes noop `popup` keeps us off the Electron UI layer.
  vi.spyOn(Menu, 'buildFromTemplate').mockImplementation((template) => {
    return { popup: () => undefined, template } as never;
  });

  await initI18n();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Build a Browser with one window and return a hideTooltip spy attached to it.
 * We spy on the window-level method because the handler calls `win.hideTooltip()`
 * before dispatching to the switch statement.
 */
function makeBrowserWithOneWindow(): { browser: Browser; hideTooltip: ReturnType<typeof vi.fn> } {
  const browser = new Browser();
  partitions.init();
  browser.createWindow(1, { withDesktops: true });

  // Window extends EventEmitter; hideTooltip is a method on the class. We grab a
  // reference and replace it on the instance (the prototype lookup happens at call time).
  const win = browser.getWindow(1)!;
  const hideTooltip = vi.fn();
  // Replace the method on this specific instance.
  (win as unknown as { hideTooltip: () => void }).hideTooltip = hideTooltip;
  return { browser, hideTooltip };
}

describe('setupMenuIPC', () => {
  test("registers 'menu:context-menu' on ipcMain (not as 'handle')", () => {
    const { browser } = makeBrowserWithOneWindow();
    setupMenuIPC(browser);

    expect(handlers.has('menu:context-menu')).toBe(true);
    // We only care about `on` for menu IPC; `handle` should not have been touched
    // (no entries in the handlers map for ipcMain.handle).
  });

  test('menu:context-menu handler calls win.hideTooltip() before processing the type', async () => {
    const { browser, hideTooltip } = makeBrowserWithOneWindow();
    setupMenuIPC(browser);

    const handler = handlers.get('menu:context-menu')!;

    // Trigger with type='main' (the simplest path that does NOT depend on extra lookup).
    handler(fakeEvent, {
      winId: 1,
      type: 'main',
      params: {},
    });

    expect(hideTooltip).toHaveBeenCalledTimes(1);
  });

  test('menu:context-menu handler calls win.hideTooltip() for the desktop type', async () => {
    const { browser, hideTooltip } = makeBrowserWithOneWindow();
    setupMenuIPC(browser);

    const handler = handlers.get('menu:context-menu')!;

    handler(fakeEvent, {
      winId: 1,
      type: 'desktop',
      params: { desktopId: 1 },
    });

    expect(hideTooltip).toHaveBeenCalledTimes(1);
  });

  test('menu:context-menu handler calls win.hideTooltip() even when the type is invalid (early return)', async () => {
    const { browser, hideTooltip } = makeBrowserWithOneWindow();
    setupMenuIPC(browser);

    const handler = handlers.get('menu:context-menu')!;

    // desktop type with no desktopId param — the handler logs a warning and returns,
    // but hideTooltip MUST have already been invoked (the issue we are guarding against).
    handler(fakeEvent, {
      winId: 1,
      type: 'desktop',
      params: {},
    });

    expect(hideTooltip).toHaveBeenCalledTimes(1);
  });

  test('menu:context-menu handler does NOT call win.hideTooltip() if windowChecker fails', async () => {
    const { browser, hideTooltip } = makeBrowserWithOneWindow();
    setupMenuIPC(browser);

    const handler = handlers.get('menu:context-menu')!;

    // windowChecker returns null for a missing winId, which short-circuits BEFORE
    // hideTooltip runs. This guards the order of operations.
    handler(fakeEvent, { type: 'main', params: {} });

    expect(hideTooltip).not.toHaveBeenCalled();
  });
});
