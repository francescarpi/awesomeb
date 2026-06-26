import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain, type IpcMainEvent } from 'electron';
import { Browser, WelcomeWindow } from '@/core';
import { setupWelcomeIPC } from './ipc';

type Handler = (event: IpcMainEvent, ...args: unknown[]) => void;
const handlers = new Map<string, Handler>();

function fakeWelcomeWindow(id: number): WelcomeWindow {
  return {
    webContentsID: id,
    show: vi.fn(),
    close: vi.fn(),
  } as unknown as WelcomeWindow;
}

function makeEvent(url: string, id: number): IpcMainEvent {
  return { sender: { getURL: () => url, id } } as unknown as IpcMainEvent;
}

describe('Welcome IPC', () => {
  let browser: Browser;
  let win: WelcomeWindow;

  beforeEach(() => {
    handlers.clear();
    vi.spyOn(ipcMain, 'on').mockImplementation(((channel: string, listener: Handler) => {
      handlers.set(channel, listener);
      return ipcMain;
    }) as typeof ipcMain.on);

    browser = new Browser();
    win = fakeWelcomeWindow(7);
    browser.setWelcomeWindow(win);

    setupWelcomeIPC(browser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handler registration', () => {
    test('registers welcome:ready', () => {
      expect(handlers.has('welcome:ready')).toBe(true);
    });

    test('registers welcome:add-search-engine-and-initiate', () => {
      expect(handlers.has('welcome:add-search-engine-and-initiate')).toBe(true);
    });
  });

  describe('welcome:ready', () => {
    test('shows the window when the URL is the welcome page and the id matches', async () => {
      const handler = handlers.get('welcome:ready')!;
      await new Promise<void>((resolve) => {
        handler(makeEvent('file:///path/to/welcome/index.html?theme=cupcake', 7), {});
        resolve();
      });

      expect(win.show).toHaveBeenCalledTimes(1);
    });

    test('does not show the window when the URL is for a different page', async () => {
      const handler = handlers.get('welcome:ready')!;
      await new Promise<void>((resolve) => {
        handler(makeEvent('http://localhost:4321/window?theme=cupcake', 7), {});
        resolve();
      });

      expect(win.show).not.toHaveBeenCalled();
    });

    test('does not show the window when the webContents id does not match', async () => {
      const handler = handlers.get('welcome:ready')!;
      await new Promise<void>((resolve) => {
        handler(makeEvent('file:///path/to/welcome/index.html', 999), {});
        resolve();
      });

      expect(win.show).not.toHaveBeenCalled();
    });

    test('does not show the window when no welcome window is registered', async () => {
      browser.setWelcomeWindow(null);
      const handler = handlers.get('welcome:ready')!;
      await new Promise<void>((resolve) => {
        handler(makeEvent('file:///path/to/welcome/index.html', 7), {});
        resolve();
      });

      expect(win.show).not.toHaveBeenCalled();
    });
  });
});
