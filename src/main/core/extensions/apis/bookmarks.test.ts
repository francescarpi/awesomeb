import { describe, expect, test, beforeEach, vi } from 'vitest';
import { ChromeBookmarks } from './bookmarks';
import { partitions } from '@/core';
import { ExtensionPopup } from '../popup';
import { Browser, Window } from '@/core';
import type { IBookmark, IExtension } from '~/types';

function createTestUrlBookmark(partial?: Partial<IBookmark>): IBookmark {
  return {
    id: 'test-url-id',
    type: 'url',
    url: 'https://example.com',
    title: 'Test Bookmark',
    dateAdded: 1234567890,
    ...partial,
  };
}

function createTestFolderBookmark(partial?: Partial<IBookmark>): IBookmark {
  return {
    id: 'test-folder-id',
    type: 'folder',
    title: 'Test Folder',
    children: [],
    dateAdded: 1234567890,
    ...partial,
  };
}

interface FakePopup {
  webContents: {
    isDestroyed: () => boolean;
    send: ReturnType<typeof vi.fn>;
  };
}

function createFakePopup({ destroyed = false }: { destroyed?: boolean } = {}): FakePopup {
  return {
    webContents: {
      isDestroyed: () => destroyed,
      send: vi.fn(),
    },
  };
}

interface FakeServiceWorker {
  versionId: number;
  isDestroyed: () => boolean;
  send: ReturnType<typeof vi.fn>;
}

function createFakeServiceWorker(versionId: number, { destroyed = false } = {}): FakeServiceWorker {
  return {
    versionId,
    isDestroyed: () => destroyed,
    send: vi.fn(),
  };
}

describe('ChromeBookmarks.notifyChanged', () => {
  let browser: Browser;
  let chromeBookmarks: ChromeBookmarks;
  let popup1: FakePopup;
  let popup2: FakePopup;
  let sw1: FakeServiceWorker;
  let sw2: FakeServiceWorker;

  beforeEach(() => {
    browser = new Browser();
    chromeBookmarks = new ChromeBookmarks(browser);

    popup1 = createFakePopup();
    popup2 = createFakePopup();
    sw1 = createFakeServiceWorker(101);
    sw2 = createFakeServiceWorker(102);

    vi.spyOn(ExtensionPopup.prototype, 'webContents', 'get').mockReturnValue(
      popup1.webContents as never,
    );

    vi.spyOn(browser, 'windows', 'get').mockReturnValue([
      { getView: (id: string) => (id === 'extension-popup' ? (popup1 as never) : null) } as never,
      { getView: (id: string) => (id === 'extension-popup' ? (popup2 as never) : null) } as never,
    ]);

    vi.spyOn(partitions, 'allForExtensions', 'get').mockReturnValue([
      {
        ses: {
          serviceWorkers: {
            getAllRunning: () => ({ 101: {}, 102: {} }),
            getWorkerFromVersionID: (versionId: number) => {
              if (versionId === 101) return sw1 as never;
              if (versionId === 102) return sw2 as never;
              return undefined;
            },
          },
        },
      } as never,
    ]);
  });

  test('broadcasts bookmarks.onCreated to all popups and service workers', () => {
    const url = createTestUrlBookmark({ id: 'new-url' });

    chromeBookmarks.notifyChanged({
      kind: 'created',
      parentId: 'root',
      items: [url],
    });

    const expectedChannel = 'extensions:crx-event:bookmarks.onCreated';
    const expectedParams = {
      id: 'new-url',
      bookmark: expect.objectContaining({
        id: 'new-url',
        parentId: '2',
      }),
    };

    expect(popup1.webContents.send).toHaveBeenCalledWith(expectedChannel, expectedParams);
    expect(popup2.webContents.send).toHaveBeenCalledWith(expectedChannel, expectedParams);
    expect(sw1.send).toHaveBeenCalledWith(expectedChannel, expectedParams);
    expect(sw2.send).toHaveBeenCalledWith(expectedChannel, expectedParams);
  });

  test("maps internal 'root' parentId to OTHER_ID ('2') in the emitted BookmarkTreeNode", () => {
    const url = createTestUrlBookmark({ id: 'new-url' });

    chromeBookmarks.notifyChanged({
      kind: 'created',
      parentId: 'root',
      items: [url],
    });

    const call = popup1.webContents.send.mock.calls[0];
    const params = call[1];
    expect(params.bookmark.parentId).toBe('2');
  });

  test('preserves non-root parentId in the emitted BookmarkTreeNode', () => {
    const url = createTestUrlBookmark({ id: 'child-url' });

    chromeBookmarks.notifyChanged({
      kind: 'created',
      parentId: 'parent-folder',
      items: [url],
    });

    const call = popup1.webContents.send.mock.calls[0];
    const params = call[1];
    expect(params.id).toBe('child-url');
    expect(params.bookmark.parentId).toBe('parent-folder');
  });

  test('emits one event per created item when multiple items are created', () => {
    const url1 = createTestUrlBookmark({ id: 'url-1' });
    const url2 = createTestUrlBookmark({ id: 'url-2' });

    chromeBookmarks.notifyChanged({
      kind: 'created',
      parentId: 'root',
      items: [url1, url2],
    });

    expect(popup1.webContents.send).toHaveBeenCalledTimes(2);
    expect(sw1.send).toHaveBeenCalledTimes(2);

    const firstCall = popup1.webContents.send.mock.calls[0];
    const secondCall = popup1.webContents.send.mock.calls[1];
    expect(firstCall[1].id).toBe('url-1');
    expect(secondCall[1].id).toBe('url-2');
  });

  test('includes children when a folder with bookmarks is created', () => {
    const child = createTestUrlBookmark({ id: 'child', title: 'Child Site' });
    const folder = createTestFolderBookmark({
      id: 'new-folder',
      title: 'New Folder',
      children: [child],
    }) as IBookmark & { type: 'folder'; children: IBookmark[] };

    chromeBookmarks.notifyChanged({
      kind: 'created',
      parentId: 'root',
      items: [folder],
    });

    const call = popup1.webContents.send.mock.calls[0];
    const params = call[1];
    expect(params.id).toBe('new-folder');
    expect(params.bookmark.children).toHaveLength(1);
    expect(params.bookmark.children?.[0].id).toBe('child');
    expect(params.bookmark.children?.[0].parentId).toBe('new-folder');
  });

  test('does not broadcast anything when tree and previousTree are equal', () => {
    const tree = [createTestUrlBookmark({ id: 'a' })];
    chromeBookmarks.notifyChanged({
      kind: 'updated',
      tree,
      previousTree: tree,
    });

    expect(popup1.webContents.send).not.toHaveBeenCalled();
    expect(popup2.webContents.send).not.toHaveBeenCalled();
    expect(sw1.send).not.toHaveBeenCalled();
    expect(sw2.send).not.toHaveBeenCalled();
  });

  test('skips destroyed popups without throwing or affecting other targets', () => {
    popup1.webContents.isDestroyed = () => true;
    const sendSpy = popup1.webContents.send;
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() =>
      chromeBookmarks.notifyChanged({
        kind: 'created',
        parentId: 'root',
        items: [createTestUrlBookmark({ id: 'x' })],
      }),
    ).not.toThrow();

    expect(sendSpy).not.toHaveBeenCalled();
    expect(popup2.webContents.send).toHaveBeenCalled();
    expect(sw1.send).toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  test('skips destroyed service workers without throwing or affecting other targets', () => {
    sw1.isDestroyed = () => true;
    const sendSpy = sw1.send;
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() =>
      chromeBookmarks.notifyChanged({
        kind: 'created',
        parentId: 'root',
        items: [createTestUrlBookmark({ id: 'x' })],
      }),
    ).not.toThrow();

    expect(sendSpy).not.toHaveBeenCalled();
    expect(popup1.webContents.send).toHaveBeenCalled();
    expect(sw2.send).toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  test('continues broadcasting to other targets when one popup throws', () => {
    popup1.webContents.send = vi.fn(() => {
      throw new Error('popup crashed');
    });
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() =>
      chromeBookmarks.notifyChanged({
        kind: 'created',
        parentId: 'root',
        items: [createTestUrlBookmark({ id: 'x' })],
      }),
    ).not.toThrow();

    expect(popup2.webContents.send).toHaveBeenCalled();
    expect(sw1.send).toHaveBeenCalled();
    expect(sw2.send).toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  test('continues broadcasting to other targets when one service worker throws', () => {
    sw1.send = vi.fn(() => {
      throw new Error('sw crashed');
    });
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() =>
      chromeBookmarks.notifyChanged({
        kind: 'created',
        parentId: 'root',
        items: [createTestUrlBookmark({ id: 'x' })],
      }),
    ).not.toThrow();

    expect(popup1.webContents.send).toHaveBeenCalled();
    expect(popup2.webContents.send).toHaveBeenCalled();
    expect(sw2.send).toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  test('does not throw when there are no popups and no service workers', () => {
    vi.spyOn(browser, 'windows', 'get').mockReturnValue([]);
    vi.spyOn(partitions, 'allForExtensions', 'get').mockReturnValue([]);

    expect(() =>
      chromeBookmarks.notifyChanged({
        kind: 'created',
        parentId: 'root',
        items: [createTestUrlBookmark({ id: 'x' })],
      }),
    ).not.toThrow();
  });
});

describe('ChromeBookmarks.notifyChanged - diff on update()', () => {
  let browser: Browser;
  let chromeBookmarks: ChromeBookmarks;
  let popup: FakePopup;
  let sw: FakeServiceWorker;

  function setupChromeBookmarks(initialBookmarks: IBookmark[]): void {
    browser = new Browser();
    chromeBookmarks = new ChromeBookmarks(browser);

    popup = createFakePopup();
    sw = createFakeServiceWorker(101);

    vi.spyOn(ExtensionPopup.prototype, 'webContents', 'get').mockReturnValue(
      popup.webContents as never,
    );
    vi.spyOn(browser, 'windows', 'get').mockReturnValue([
      { getView: (id: string) => (id === 'extension-popup' ? (popup as never) : null) } as never,
    ]);
    vi.spyOn(partitions, 'allForExtensions', 'get').mockReturnValue([
      {
        ses: {
          serviceWorkers: {
            getAllRunning: () => ({ 101: {} }),
            getWorkerFromVersionID: (versionId: number) =>
              versionId === 101 ? (sw as never) : undefined,
          },
        },
      } as never,
    ]);

    browser.bookmarks.update(initialBookmarks);
    popup.webContents.send.mockClear();
    sw.send.mockClear();
  }

  test('lazily initializes previous tree on first update without emitting events', () => {
    setupChromeBookmarks([createTestUrlBookmark({ id: 'a' }), createTestUrlBookmark({ id: 'b' })]);

    expect(chromeBookmarks).toBeDefined();
    expect(popup.webContents.send).not.toHaveBeenCalled();
    expect(sw.send).not.toHaveBeenCalled();
  });

  test('emits onRemoved when a bookmark is deleted via update()', () => {
    setupChromeBookmarks([createTestUrlBookmark({ id: 'a' }), createTestUrlBookmark({ id: 'b' })]);

    browser.bookmarks.update([createTestUrlBookmark({ id: 'a' })]);

    const removedCall = popup.webContents.send.mock.calls.find(
      (c) => c[0] === 'extensions:crx-event:bookmarks.onRemoved',
    );
    expect(removedCall).toBeDefined();
    expect(removedCall![1].id).toBe('b');
    expect(removedCall![1].removeInfo.node.id).toBe('b');
    expect(removedCall![1].removeInfo.parentId).toBe('2');
  });

  test('emits onRemoved when a folder with children is deleted', () => {
    const child = createTestUrlBookmark({ id: 'child', title: 'Child' });
    const folder = {
      ...createTestFolderBookmark({
        id: 'folder',
        title: 'Folder',
        children: [child],
      }),
    } as IBookmark;
    setupChromeBookmarks([createTestUrlBookmark({ id: 'top' }), folder]);

    browser.bookmarks.update([createTestUrlBookmark({ id: 'top' })]);

    const removeCalls = popup.webContents.send.mock.calls.filter(
      (c) => c[0] === 'extensions:crx-event:bookmarks.onRemoved',
    );
    const removedIds = removeCalls.map((c) => c[1].id);
    expect(removedIds).toContain('folder');
    expect(removedIds).toContain('child');
  });

  test('emits onCreated when a bookmark appears via update()', () => {
    setupChromeBookmarks([createTestUrlBookmark({ id: 'a' })]);

    browser.bookmarks.update([
      createTestUrlBookmark({ id: 'a' }),
      createTestUrlBookmark({ id: 'b' }),
    ]);

    const createdCalls = popup.webContents.send.mock.calls.filter(
      (c) => c[0] === 'extensions:crx-event:bookmarks.onCreated',
    );
    expect(createdCalls).toHaveLength(1);
    expect(createdCalls[0][1].id).toBe('b');
    expect(createdCalls[0][1].bookmark.parentId).toBe('2');
  });

  test('does not emit anything when update() receives the same tree', () => {
    const tree = [createTestUrlBookmark({ id: 'a' }), createTestUrlBookmark({ id: 'b' })];
    setupChromeBookmarks(tree);

    browser.bookmarks.update(tree);

    const bookmarkEvents = popup.webContents.send.mock.calls.filter(
      (c) =>
        c[0] === 'extensions:crx-event:bookmarks.onCreated' ||
        c[0] === 'extensions:crx-event:bookmarks.onRemoved',
    );
    expect(bookmarkEvents).toHaveLength(0);
  });

  test('emits both onCreated and onRemoved for simultaneous add+remove in same update', () => {
    setupChromeBookmarks([createTestUrlBookmark({ id: 'a' }), createTestUrlBookmark({ id: 'b' })]);

    browser.bookmarks.update([
      createTestUrlBookmark({ id: 'a' }),
      createTestUrlBookmark({ id: 'c' }),
    ]);

    const createdCalls = popup.webContents.send.mock.calls.filter(
      (c) => c[0] === 'extensions:crx-event:bookmarks.onCreated',
    );
    const removedCalls = popup.webContents.send.mock.calls.filter(
      (c) => c[0] === 'extensions:crx-event:bookmarks.onRemoved',
    );
    expect(createdCalls.map((c) => c[1].id)).toEqual(['c']);
    expect(removedCalls.map((c) => c[1].id)).toEqual(['b']);
  });

  test('uses folder id as parentId for nested removed bookmarks', () => {
    const folder = {
      ...createTestFolderBookmark({
        id: 'parent-folder',
        title: 'Parent',
        children: [createTestUrlBookmark({ id: 'nested-url', title: 'Nested' })],
      }),
    } as IBookmark;
    setupChromeBookmarks([folder]);

    browser.bookmarks.update([]);

    const removeCalls = popup.webContents.send.mock.calls.filter(
      (c) => c[0] === 'extensions:crx-event:bookmarks.onRemoved',
    );
    const nestedRemoved = removeCalls.find((c) => c[1].id === 'nested-url');
    expect(nestedRemoved).toBeDefined();
    expect(nestedRemoved![1].removeInfo.parentId).toBe('parent-folder');
  });
});

describe('ChromeBookmarks.get', () => {
  let browser: Browser;
  let chromeBookmarks: ChromeBookmarks;
  const fakeWindow = {} as Window;
  const fakeExtension = {} as IExtension;

  beforeEach(() => {
    browser = new Browser();
    chromeBookmarks = new ChromeBookmarks(browser);

    browser.bookmarks.update([
      createTestUrlBookmark({ id: 'url-1', title: 'A' }),
      {
        ...createTestFolderBookmark({
          id: 'folder-1',
          title: 'Folder',
          children: [createTestUrlBookmark({ id: 'url-2', title: 'B' })],
        }),
      },
    ]);
  });

  test('returns the full flat tree when called with no arguments', async () => {
    const result = await chromeBookmarks.get(fakeWindow, fakeExtension);

    const ids = result.map((n) => n.id);
    expect(ids).toContain('url-1');
    expect(ids).toContain('url-2');
    expect(ids).toContain('folder-1');
    expect(ids).toContain('0');
    expect(ids).toContain('2');
  });

  test('returns the full flat tree when called with null (floccus case)', async () => {
    const result = await chromeBookmarks.get(fakeWindow, fakeExtension, null);

    const ids = result.map((n) => n.id);
    expect(ids).toContain('url-1');
    expect(ids).toContain('url-2');
    expect(ids).toContain('folder-1');
  });

  test('returns the full flat tree when called with undefined', async () => {
    const result = await chromeBookmarks.get(fakeWindow, fakeExtension, undefined);

    const ids = result.map((n) => n.id);
    expect(ids).toContain('url-1');
    expect(ids).toContain('url-2');
  });

  test('returns matching node when called with a single id', async () => {
    const result = await chromeBookmarks.get(fakeWindow, fakeExtension, 'url-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('url-1');
  });

  test('returns matching nodes when called with an array of ids', async () => {
    const result = await chromeBookmarks.get(fakeWindow, fakeExtension, ['url-1', 'url-2']);

    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id).sort()).toEqual(['url-1', 'url-2']);
  });

  test('returns empty array when no id matches', async () => {
    const result = await chromeBookmarks.get(fakeWindow, fakeExtension, 'nonexistent');

    expect(result).toEqual([]);
  });
});
