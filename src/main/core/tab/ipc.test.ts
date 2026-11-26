import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain, type IpcMain, type IpcMainEvent } from 'electron';
import { Browser, partitions } from '@/core';
import { setupTabIPC } from './ipc';

type Handler = (event: IpcMainEvent, ...args: unknown[]) => void;

const handlers = new Map<string, Handler>();
const fakeEvent = {} as unknown as IpcMainEvent;

beforeEach(() => {
  handlers.clear();

  vi.spyOn(ipcMain, 'on').mockImplementation(((channel: string, fn: Handler): IpcMain => {
    handlers.set(channel, fn);
    return ipcMain;
  }) as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('setupTabIPC - tabs:set-emoji', () => {
  test("registers 'tabs:set-emoji' on ipcMain", () => {
    const browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });

    setupTabIPC(browser);

    expect(handlers.has('tabs:set-emoji')).toBe(true);
  });

  test('stores the emoji on the tab', async () => {
    const browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });

    const result = await browser.openURL('http://example.com');
    const tab = result!.tab;

    setupTabIPC(browser);

    const handler = handlers.get('tabs:set-emoji')!;
    handler(fakeEvent, { tabId: tab.id, emoji: '😀' });

    expect(tab.emoji).toBe('😀');
  });

  test('clears the emoji when null is sent', async () => {
    const browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });

    const result = await browser.openURL('http://example.com');
    const tab = result!.tab;
    tab.setEmoji('😀');

    setupTabIPC(browser);

    const handler = handlers.get('tabs:set-emoji')!;
    handler(fakeEvent, { tabId: tab.id, emoji: null });

    expect(tab.emoji).toBeNull();
  });
});
