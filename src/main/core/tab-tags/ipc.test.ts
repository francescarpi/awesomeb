import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { Browser, partitions, tabTags } from '@/core';
import { setupTabTagsIPC } from './ipc';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';

type InvokeHandler = (event: IpcMainInvokeEvent, args: Record<string, unknown>) => Promise<unknown>;

const handlers = new Map<string, InvokeHandler>();

const fakeEvent = { sender: { id: 1 } } as unknown as IpcMainInvokeEvent;

function getTabTagsFilePath() {
  return path.join(userDataPath(), 'tab-tags.json');
}

function cleanTabTagsFile() {
  const filePath = getTabTagsFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('TabTags IPC', () => {
  let browser: Browser;
  let tabId: number;

  beforeEach(async () => {
    cleanTabTagsFile();

    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });

    // An internal page is used on purpose: the visit-history hooks ignore
    // them, and the visit-history store is shared with its own tests.
    await browser.openURL('awesomeb://bookmarks/');

    tabId = browser.tabs[0].tab.id;

    handlers.clear();

    vi.spyOn(ipcMain, 'handle').mockImplementation((channel: string, fn: InvokeHandler) => {
      handlers.set(channel, fn);
    });

    setupTabTagsIPC(browser);
  });

  afterEach(() => {
    tabTags.removeTab(tabId);
    cleanTabTagsFile();
    vi.restoreAllMocks();
  });

  test('tabtags:assign handler is registered as handler', () => {
    expect(handlers.has('tabtags:assign')).toBe(true);
  });

  test('tabtags:assign assigns the tag to the tab and returns its tags', async () => {
    const handler = handlers.get('tabtags:assign')!;
    const result = await handler(fakeEvent, {
      winId: 1,
      tabId,
      tagId: 'tag-1',
    });

    expect(result).toEqual(['tag-1']);
    expect(tabTags.get(tabId)).toEqual(['tag-1']);
  });

  test('tabtags:assign keeps the tags already assigned to the tab', async () => {
    const handler = handlers.get('tabtags:assign')!;

    await handler(fakeEvent, { winId: 1, tabId, tagId: 'tag-1' });
    const result = await handler(fakeEvent, { winId: 1, tabId, tagId: 'tag-2' });

    expect(result).toEqual(['tag-1', 'tag-2']);
    expect(tabTags.get(tabId)).toEqual(['tag-1', 'tag-2']);
  });

  test('tabtags:assign returns undefined when the tab does not exist', async () => {
    const handler = handlers.get('tabtags:assign')!;
    const result = await handler(fakeEvent, {
      winId: 1,
      tabId: 9999,
      tagId: 'tag-1',
    });

    expect(result).toBeUndefined();
    expect(tabTags.get(9999)).toEqual([]);
  });
});
