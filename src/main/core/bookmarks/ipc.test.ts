import { describe, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import i18next from 'i18next';
import { ipcMain, type IpcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import { Browser, bookmarks, partitions } from '@/core';
import * as helpers from '@/core/browser/helpers';
import { setupBookmarksIPC } from './ipc';
import { initI18n } from '~/i18n';
import { EBookmarkType, type IBookmark } from '~/types';

type InvokeHandler = (event: IpcMainInvokeEvent, args: Record<string, unknown>) => Promise<unknown>;
type OnListener = (event: IpcMainEvent, ...args: unknown[]) => void;
const handlers = new Map<string, InvokeHandler>();
const onHandlers = new Map<string, OnListener>();

const fakeEvent = { sender: { id: 1 } } as unknown as IpcMainInvokeEvent;
const fakeOnEvent = { sender: { id: 1 } } as unknown as IpcMainEvent;

type OnHandler = (event: IpcMainEvent, args: Record<string, unknown>) => Promise<unknown>;

function makeUrlBookmark(overrides: Partial<IBookmark> = {}): IBookmark {
  return {
    id: 'bm-1',
    type: EBookmarkType.Url,
    url: 'https://example.com',
    title: 'Example',
    dateAdded: 1000,
    ...overrides,
  } as IBookmark;
}

beforeAll(initI18n);
afterAll(() => i18next.changeLanguage('en'));

describe('Bookmarks IPC', () => {
  let browser: Browser;
  let refreshSpy: ReturnType<typeof vi.spyOn>;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;
  let notificationSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    handlers.clear();
    onHandlers.clear();

    vi.spyOn(ipcMain, 'handle').mockImplementation((channel: string, fn: InvokeHandler) => {
      handlers.set(channel, fn);
    });
    vi.spyOn(ipcMain, 'on').mockImplementation(((channel: string, fn: OnListener): IpcMain => {
      onHandlers.set(channel, fn);
      return ipcMain;
    }) as never);

    bookmarks.update([]);
    notificationSpy = vi.spyOn(helpers, 'notification').mockImplementation(() => {});

    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });

    refreshSpy = vi.spyOn(browser, 'refreshMainMenu').mockResolvedValue();
    invalidateSpy = vi.spyOn(browser, 'invalidateBookmarksMenuCache').mockImplementation(() => {});

    setupBookmarksIPC(browser);
  });

  afterEach(() => {
    bookmarks.update([]);
    vi.restoreAllMocks();
  });

  test('bookmarks:add handler is registered', () => {
    expect(onHandlers.has('bookmarks:add')).toBe(true);
  });

  test('bookmarks:update handler is registered', () => {
    expect(handlers.has('bookmarks:update')).toBe(true);
  });

  test('bookmarks:add adds a bookmark, invalidates the menu cache, and refreshes the menu', async () => {
    const win = browser.getWindow(1)!;
    win.modal.open('add-bookmark');

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(bookmarks.all.length).toBe(0);

    const handler = onHandlers.get('bookmarks:add') as unknown as OnHandler;
    await handler(fakeOnEvent, {
      winId: 1,
      parentFolderId: 'root',
      title: 'New Bookmark',
      url: 'https://new.example.com',
      newFolderName: null,
    });

    expect(bookmarks.all.length).toBe(1);
    expect(bookmarks.all[0].title).toBe('New Bookmark');
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(notificationSpy).toHaveBeenCalledWith('Bookmark Added', 'Bookmark added successfully');
  });

  test('bookmarks:update persists the new list, invalidates the menu cache, and refreshes the menu', async () => {
    await browser.openURL('awesomeb://bookmarks/');
    expect(browser.tabs.length).toBe(1);
    refreshSpy.mockClear();
    invalidateSpy.mockClear();

    const newList: IBookmark[] = [makeUrlBookmark({ id: 'replaced-1', title: 'Replaced' })];
    expect(bookmarks.all.length).toBe(0);

    const handler = handlers.get('bookmarks:update')!;
    const result = await handler(fakeEvent, { bookmarksList: newList });

    expect(result).toBeUndefined();
    expect(bookmarks.all.length).toBe(1);
    expect(bookmarks.all[0].id).toBe('replaced-1');
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(notificationSpy).toHaveBeenCalledWith(
      'Bookmarks Updated',
      'Bookmarks updated successfully',
    );
  });

  test('bookmarks:add with no modal open returns undefined and does not touch cache or menu', async () => {
    const win = browser.getWindow(1)!;
    expect(win.modal.id).toBeNull();

    const handler = onHandlers.get('bookmarks:add') as unknown as OnHandler;
    const result = await handler(fakeOnEvent, {
      winId: 1,
      parentFolderId: 'root',
      title: 'Wont be added',
      url: 'https://wont.example.com',
      newFolderName: null,
    });

    expect(result).toBeUndefined();
    expect(bookmarks.all.length).toBe(0);
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(refreshSpy).not.toHaveBeenCalled();
    expect(notificationSpy).not.toHaveBeenCalled();
  });
});
