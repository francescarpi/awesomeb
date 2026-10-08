import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain, type IpcMainInvokeEvent, type IpcMain } from 'electron';
import { Browser, partitions } from '@/core';
import { setupFaviconsIpc } from './ipc';

type InvokeHandler = (event: IpcMainInvokeEvent, args: Record<string, unknown>) => Promise<unknown>;
const handlers = new Map<string, InvokeHandler>();

const fakeEvent = { sender: { id: 1 } } as unknown as IpcMainInvokeEvent;

function makeFakeImage(): unknown {
  return { resize: vi.fn().mockReturnThis() };
}

describe('Favicons IPC', () => {
  let browser: Browser;
  let getFaviconByUrlSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    handlers.clear();
    vi.spyOn(ipcMain, 'handle').mockImplementation(
      (channel: string, fn: InvokeHandler): IpcMain => {
        handlers.set(channel, fn);
        return ipcMain;
      },
    );

    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });

    getFaviconByUrlSpy = vi
      .spyOn(browser.favicons, 'getFaviconByUrl')
      .mockReturnValue(makeFakeImage() as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('favicons:get handler is registered', () => {
    setupFaviconsIpc(browser);
    expect(handlers.has('favicons:get')).toBe(true);
  });

  test('returns the tab favicon when the tab has one set', async () => {
    setupFaviconsIpc(browser);

    const opened = await browser.openURL('https://tab-with-favicon.example.com');
    expect(opened).not.toBeNull();
    opened!.tab.setFavicon('data:image/png;base64,TAB_FAVICON');

    const handler = handlers.get('favicons:get')!;
    const result = await handler(fakeEvent, {
      winId: 1,
      tabId: opened!.tab.id,
    });

    expect(result).toBe('data:image/png;base64,TAB_FAVICON');
    expect(getFaviconByUrlSpy).not.toHaveBeenCalled();
  });

  test('falls back to getFaviconByUrl when the tab has no favicon but has a URL', async () => {
    setupFaviconsIpc(browser);

    const opened = await browser.openURL('https://tab-no-favicon.example.com');
    expect(opened).not.toBeNull();
    expect(opened!.tab.favicon).toBeFalsy();
    expect(opened!.tab.url).toBe('https://tab-no-favicon.example.com/');

    const fakeImage = makeFakeImage();
    getFaviconByUrlSpy.mockReturnValue(fakeImage as never);

    const handler = handlers.get('favicons:get')!;
    const result = await handler(fakeEvent, {
      winId: 1,
      tabId: opened!.tab.id,
    });

    expect(getFaviconByUrlSpy).toHaveBeenCalledWith('https://tab-no-favicon.example.com/');
    expect(result).toBe(fakeImage);
  });

  test('returns null when the tab has no favicon and no URL', async () => {
    setupFaviconsIpc(browser);

    const win = browser.getWindow(1)!;
    vi.spyOn(win, 'getTab').mockReturnValue({
      tab: { favicon: null, url: null },
    } as never);

    const handler = handlers.get('favicons:get')!;
    const result = await handler(fakeEvent, {
      winId: 1,
      tabId: 'any-tab-id',
    });

    expect(result).toBeNull();
    expect(getFaviconByUrlSpy).not.toHaveBeenCalled();
  });

  test('returns null when the tab is not found in the window', async () => {
    setupFaviconsIpc(browser);

    const handler = handlers.get('favicons:get')!;
    const result = await handler(fakeEvent, {
      winId: 1,
      tabId: 'tab-does-not-exist',
    });

    expect(result).toBeNull();
    expect(getFaviconByUrlSpy).not.toHaveBeenCalled();
  });
});
