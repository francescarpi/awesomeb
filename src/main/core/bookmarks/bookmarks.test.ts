import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { Bookmarks } from './bookmarks';
import { ZodError } from 'zod';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';
import type { IUrlBookmark, IFolderBookmark } from './schemes';
import { Browser } from '@/core';
import type { IBookmark } from '~/types';

function getBookmarksFilePath(): string {
  return path.join(userDataPath(), 'bookmarks.json');
}

function cleanBookmarksFile(): void {
  const filePath = getBookmarksFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function createTestUrlBookmark(partial?: Partial<IUrlBookmark>): IUrlBookmark {
  return {
    id: 'test-url-id',
    type: 'url',
    url: 'https://example.com',
    title: 'Test Bookmark',
    dateAdded: 1234567890,
    ...partial,
  };
}

function createTestFolderBookmark(partial?: Partial<IFolderBookmark>): IFolderBookmark {
  return {
    id: 'test-folder-id',
    type: 'folder',
    title: 'Test Folder',
    children: [],
    dateAdded: 1234567890,
    ...partial,
  };
}

function setupBrowserWithBookmarks(): { browser: Browser; bookmarks: Bookmarks } {
  cleanBookmarksFile();
  const browser = new Browser();
  return { browser, bookmarks: new Bookmarks(browser) };
}

function isUrlBookmark(b: IBookmark): b is IUrlBookmark {
  return b.type === 'url';
}

function isFolderBookmark(b: IBookmark): b is IFolderBookmark {
  return b.type === 'folder';
}

describe('Bookmarks', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    cleanBookmarksFile();
  });

  afterEach(() => {
    cleanBookmarksFile();
  });

  describe('constructor', () => {
    test('with valid defaults succeeds', () => {
      const bookmarks = new Bookmarks(browser);
      expect(bookmarks).toBeDefined();
      expect(bookmarks.all).toEqual([]);
    });

    test('falls back to defaults when on-disk JSON is corrupted', () => {
      const filePath = getBookmarksFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          bookmarks: 'not-an-array',
        }),
      );

      const bookmarks = new Bookmarks(browser);
      expect(bookmarks).toBeDefined();
      expect(bookmarks.all).toEqual([]);
    });
  });

  describe('all getter', () => {
    test('returns empty array when no bookmarks stored', () => {
      const { bookmarks } = setupBrowserWithBookmarks();
      expect(bookmarks.all).toEqual([]);
    });
  });

  describe('find()', () => {
    test('locates bookmark by id at root', () => {
      const { bookmarks } = setupBrowserWithBookmarks();
      const url = createTestUrlBookmark({ id: 'url-1' });
      bookmarks.update([url]);

      const found = bookmarks.find('url-1');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('url-1');
    });

    test('locates bookmark nested deep in folders', () => {
      const { bookmarks } = setupBrowserWithBookmarks();
      const deepUrl = createTestUrlBookmark({ id: 'deep-url' });
      const innerFolder = createTestFolderBookmark({ id: 'inner', children: [deepUrl] });
      const outerFolder = createTestFolderBookmark({ id: 'outer', children: [innerFolder] });
      bookmarks.update([outerFolder]);

      const found = bookmarks.find('deep-url');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('deep-url');
    });

    test('returns null when bookmark does not exist', () => {
      const { bookmarks } = setupBrowserWithBookmarks();
      bookmarks.update([createTestUrlBookmark({ id: 'url-1' })]);

      expect(bookmarks.find('nonexistent')).toBeNull();
    });
  });

  describe('plainList()', () => {
    test('returns flat list with correct paths', () => {
      const { bookmarks } = setupBrowserWithBookmarks();
      const url1 = createTestUrlBookmark({ id: 'u1', title: 'A', url: 'https://a.com' });
      const url2 = createTestUrlBookmark({ id: 'u2', title: 'B', url: 'https://b.com' });
      const folder = createTestFolderBookmark({ id: 'f1', title: 'Work', children: [url2] });
      bookmarks.update([url1, folder]);

      const plain = bookmarks.plainList;
      expect(plain.length).toBe(2);

      const plainA = plain.find((p) => p.id === 'u1');
      expect(plainA).toBeDefined();
      expect(plainA?.path).toEqual([]);

      const plainB = plain.find((p) => p.id === 'u2');
      expect(plainB).toBeDefined();
      expect(plainB?.path).toEqual(['Work']);
    });
  });

  describe('update()', () => {
    test('persists valid array', () => {
      const { bookmarks } = setupBrowserWithBookmarks();
      const list = [createTestUrlBookmark()];
      bookmarks.update(list);
      expect(bookmarks.all.length).toBe(1);
      expect(bookmarks.all[0].id).toBe('test-url-id');
    });

    test('rejects invalid array', () => {
      const { bookmarks } = setupBrowserWithBookmarks();
      const invalid = [
        {
          id: 'bad',
          type: 'url',
          title: 'Bad',
          url: 'https://bad.com',
        },
      ];
      expect(() => bookmarks.update(invalid as unknown as IUrlBookmark[])).toThrow(ZodError);
    });
  });

  describe('add()', () => {
    describe('with root parent', () => {
      test('adds URL bookmarks to root', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const result = bookmarks.add('root', null, [{ title: 'Test', url: 'https://test.com' }]);

        expect(result.length).toBe(1);
        expect(result[0].type).toBe('url');
        expect(bookmarks.all.length).toBe(1);
        expect(bookmarks.all[0].title).toBe('Test');
      });

      test('creates folder when newFolder is provided', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        bookmarks.add('root', 'My Folder', [{ title: 'Site', url: 'https://site.com' }]);

        expect(bookmarks.all.length).toBe(1);
        const folder = bookmarks.all[0];
        expect(folder.type).toBe('folder');
        if (isFolderBookmark(folder)) {
          expect(folder.title).toBe('My Folder');
          expect(folder.children.length).toBe(1);
          expect(folder.children[0].type).toBe('url');
        }
      });

      test('creates folder with multiple entries', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        bookmarks.add('root', 'My Folder', [
          { title: 'Site', url: 'https://site.com' },
          { title: 'Docs', url: 'https://docs.com' },
        ]);

        const folder = bookmarks.all[0];
        expect(folder.type).toBe('folder');
        if (isFolderBookmark(folder)) {
          expect(folder.children.length).toBe(2);
          expect(folder.children.map((c) => c.title)).toEqual(['Site', 'Docs']);
        }
      });

      test('returns array of URL bookmarks when no newFolder', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const result = bookmarks.add('root', null, [
          { title: 'A', url: 'https://a.com' },
          { title: 'B', url: 'https://b.com' },
        ]);

        expect(result).toHaveLength(2);
        expect(result.every(isUrlBookmark)).toBe(true);
        if (isUrlBookmark(result[0]) && isUrlBookmark(result[1])) {
          expect(result[0].title).toBe('A');
          expect(result[1].title).toBe('B');
          expect(result[0].id).not.toBe(result[1].id);
          expect(result[0].dateAdded).toBeGreaterThan(0);
        }
      });

      test('returns array with the new folder when newFolder provided', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const result = bookmarks.add('root', 'Container', [{ title: 'A', url: 'https://a.com' }]);

        expect(result).toHaveLength(1);
        expect(isFolderBookmark(result[0])).toBe(true);
        if (isFolderBookmark(result[0])) {
          expect(result[0].title).toBe('Container');
          expect(result[0].children).toHaveLength(1);
        }
      });
    });

    describe('with folder parent', () => {
      test('adds URL bookmarks to existing folder', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const folder = createTestFolderBookmark({ id: 'folder-1' });
        bookmarks.update([folder]);

        const result = bookmarks.add('folder-1', null, [
          { title: 'Nested', url: 'https://nested.com' },
        ]);

        expect(result.length).toBe(1);
        expect(result[0].type).toBe('url');

        const found = bookmarks.find('folder-1');
        expect(found).not.toBeNull();
        if (isFolderBookmark(found!)) {
          expect(found.children.length).toBe(1);
          expect(found.children[0].title).toBe('Nested');
        }
      });

      test('with newFolder inserts new folder inside target folder (nested)', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const parentFolder = createTestFolderBookmark({ id: 'parent-folder' });
        bookmarks.update([parentFolder]);

        const result = bookmarks.add('parent-folder', 'Child Folder', [
          { title: 'Nested', url: 'https://nested.com' },
        ]);

        expect(result).toHaveLength(1);
        expect(isFolderBookmark(result[0])).toBe(true);

        const foundParent = bookmarks.find('parent-folder');
        expect(foundParent).not.toBeNull();
        if (isFolderBookmark(foundParent!)) {
          expect(foundParent.children).toHaveLength(1);
          const childFolder = foundParent.children[0];
          expect(isFolderBookmark(childFolder)).toBe(true);
          if (isFolderBookmark(childFolder)) {
            expect(childFolder.title).toBe('Child Folder');
            expect(childFolder.children).toHaveLength(1);
          }
        }

        expect(bookmarks.all).toHaveLength(1);
      });

      test('with newFolder AND folder parent, new folder is nested (not duplicated at root)', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const parentFolder = createTestFolderBookmark({ id: 'parent' });
        bookmarks.update([parentFolder]);

        bookmarks.add('parent', 'New Sub', [{ title: 'Item', url: 'https://item.com' }]);

        expect(bookmarks.all).toHaveLength(1);
        const root = bookmarks.all[0];
        if (isFolderBookmark(root)) {
          expect(root.id).toBe('parent');
          expect(root.children).toHaveLength(1);
          expect(isFolderBookmark(root.children[0])).toBe(true);
        }
      });

      test('inserts into deeply nested folder (3 levels)', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const level3 = createTestFolderBookmark({ id: 'level-3' });
        const level2 = createTestFolderBookmark({ id: 'level-2', children: [level3] });
        const level1 = createTestFolderBookmark({ id: 'level-1', children: [level2] });
        bookmarks.update([level1]);

        const result = bookmarks.add('level-3', null, [{ title: 'Deep', url: 'https://deep.com' }]);

        expect(result).toHaveLength(1);
        const found = bookmarks.find('level-3');
        if (isFolderBookmark(found!)) {
          expect(found.children).toHaveLength(1);
          expect(found.children[0].title).toBe('Deep');
        }
      });
    });

    describe('error handling', () => {
      test('throws when parent folder does not exist', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        expect(() =>
          bookmarks.add('nonexistent', null, [{ title: 'Site', url: 'https://site.com' }]),
        ).toThrow(/Bookmark folder not found: nonexistent/);
      });

      test('does not persist or emit when parent folder does not exist', () => {
        const { browser, bookmarks } = setupBrowserWithBookmarks();
        const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');

        expect(() =>
          bookmarks.add('nonexistent', null, [{ title: 'Site', url: 'https://site.com' }]),
        ).toThrow();

        expect(emitSpy).not.toHaveBeenCalledWith(
          'bookmarks:bookmarks-did-change',
          expect.anything(),
        );
        expect(bookmarks.all).toHaveLength(0);
      });
    });

    describe('event emission', () => {
      test('emits bookmarks:bookmarks-did-change event after successful insert', () => {
        const { browser, bookmarks } = setupBrowserWithBookmarks();
        const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');

        bookmarks.add('root', null, [{ title: 'Test', url: 'https://test.com' }]);

        expect(emitSpy).toHaveBeenCalledWith('bookmarks:bookmarks-did-change', bookmarks);
      });

      test('persists to store before emitting event', () => {
        const { browser, bookmarks } = setupBrowserWithBookmarks();
        const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');
        const setSpy = vi.spyOn(bookmarks['_store'], 'set');

        bookmarks.add('root', null, [{ title: 'Test', url: 'https://test.com' }]);

        const setOrder = setSpy.mock.invocationCallOrder[0];
        const emitOrder = emitSpy.mock.invocationCallOrder[0];
        expect(setOrder).toBeLessThan(emitOrder);
      });
    });
  });

  describe('addFolder()', () => {
    describe('with root parent', () => {
      test('creates empty folder at root', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const result = bookmarks.addFolder('root', 'My Folder');

        expect(bookmarks.all).toHaveLength(1);
        expect(isFolderBookmark(bookmarks.all[0])).toBe(true);
        if (isFolderBookmark(bookmarks.all[0])) {
          expect(bookmarks.all[0].title).toBe('My Folder');
          expect(bookmarks.all[0].children).toHaveLength(0);
        }

        expect(result).toHaveLength(1);
        expect(isFolderBookmark(result[0])).toBe(true);
        if (isFolderBookmark(result[0])) {
          expect(result[0].title).toBe('My Folder');
          expect(result[0].children).toHaveLength(0);
        }
      });

      test('returns array with the created folder (shape check)', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const result = bookmarks.addFolder('root', 'Container');

        expect(result).toHaveLength(1);
        expect(isFolderBookmark(result[0])).toBe(true);
        if (isFolderBookmark(result[0])) {
          expect(result[0].id).toBeTruthy();
          expect(result[0].type).toBe('folder');
          expect(result[0].title).toBe('Container');
          expect(result[0].dateAdded).toBeGreaterThan(0);
          expect(Array.isArray(result[0].children)).toBe(true);
        }
      });

      test('generates unique ids for multiple folders', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const r1 = bookmarks.addFolder('root', 'Folder A');
        const r2 = bookmarks.addFolder('root', 'Folder B');

        if (isFolderBookmark(r1[0]) && isFolderBookmark(r2[0])) {
          expect(r1[0].id).not.toBe(r2[0].id);
        }
        expect(bookmarks.all).toHaveLength(2);
      });
    });

    describe('with folder parent', () => {
      test('creates folder inside existing folder', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const parent = createTestFolderBookmark({ id: 'parent' });
        bookmarks.update([parent]);

        bookmarks.addFolder('parent', 'Child');

        const found = bookmarks.find('parent');
        expect(found).not.toBeNull();
        if (isFolderBookmark(found!)) {
          expect(found.children).toHaveLength(1);
          expect(isFolderBookmark(found.children[0])).toBe(true);
          if (isFolderBookmark(found.children[0])) {
            expect(found.children[0].title).toBe('Child');
          }
        }
      });

      test('creates folder at level 3 (deeply nested)', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const level3 = createTestFolderBookmark({ id: 'level-3' });
        const level2 = createTestFolderBookmark({ id: 'level-2', children: [level3] });
        const level1 = createTestFolderBookmark({ id: 'level-1', children: [level2] });
        bookmarks.update([level1]);

        bookmarks.addFolder('level-3', 'Deep Folder');

        const found = bookmarks.find('level-3');
        if (isFolderBookmark(found!)) {
          expect(found.children).toHaveLength(1);
          if (isFolderBookmark(found.children[0])) {
            expect(found.children[0].title).toBe('Deep Folder');
          }
        }
      });

      test('does not mutate existing tree (immutability)', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const originalFolder = createTestFolderBookmark({ id: 'parent', children: [] });
        const originalSnapshot = JSON.parse(JSON.stringify(originalFolder));
        bookmarks.update([originalFolder]);

        bookmarks.addFolder('parent', 'Child');

        expect(originalFolder).toEqual(originalSnapshot);
      });
    });

    describe('error handling', () => {
      test('throws when parentId does not exist', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        expect(() => bookmarks.addFolder('nonexistent', 'Orphan')).toThrow(
          /Bookmark folder not found: nonexistent/,
        );
      });

      test('throws when parentId does not exist in deeply nested tree', () => {
        const { bookmarks } = setupBrowserWithBookmarks();
        const level3 = createTestFolderBookmark({ id: 'level-3' });
        const level2 = createTestFolderBookmark({ id: 'level-2', children: [level3] });
        const level1 = createTestFolderBookmark({ id: 'level-1', children: [level2] });
        bookmarks.update([level1]);

        expect(() => bookmarks.addFolder('level-99', 'Orphan')).toThrow(
          /Bookmark folder not found: level-99/,
        );
      });

      test('does not persist or emit when parentId does not exist', () => {
        const { browser, bookmarks } = setupBrowserWithBookmarks();
        const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');

        expect(() => bookmarks.addFolder('nonexistent', 'Orphan')).toThrow();

        expect(emitSpy).not.toHaveBeenCalledWith(
          'bookmarks:bookmarks-did-change',
          expect.anything(),
        );
        expect(bookmarks.all).toHaveLength(0);
      });
    });

    describe('event emission', () => {
      test('emits bookmarks:bookmarks-did-change event after successful insert', () => {
        const { browser, bookmarks } = setupBrowserWithBookmarks();
        const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');

        bookmarks.addFolder('root', 'New Folder');

        expect(emitSpy).toHaveBeenCalledWith('bookmarks:bookmarks-did-change', bookmarks);
      });

      test('persists to store before emitting event', () => {
        const { browser, bookmarks } = setupBrowserWithBookmarks();
        const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');
        const setSpy = vi.spyOn(bookmarks['_store'], 'set');

        bookmarks.addFolder('root', 'New Folder');

        const setOrder = setSpy.mock.invocationCallOrder[0];
        const emitOrder = emitSpy.mock.invocationCallOrder[0];
        expect(setOrder).toBeLessThan(emitOrder);
      });
    });
  });

  describe('integration', () => {
    test('add() works with folder id returned from previous addFolder() call', () => {
      const { bookmarks } = setupBrowserWithBookmarks();
      const [folder] = bookmarks.addFolder('root', 'Container');
      expect(isFolderBookmark(folder!)).toBe(true);
      if (isFolderBookmark(folder!)) {
        const folderId = folder.id;

        const result = bookmarks.add(folderId, null, [
          { title: 'Child Bookmark', url: 'https://child.com' },
        ]);

        expect(result).toHaveLength(1);
        const found = bookmarks.find(folderId);
        if (isFolderBookmark(found!)) {
          expect(found.children).toHaveLength(1);
          expect(found.children[0].title).toBe('Child Bookmark');
        }
      }
    });

    test('add() and addFolder() can be chained to build a tree', () => {
      const { bookmarks } = setupBrowserWithBookmarks();

      const [level1] = bookmarks.addFolder('root', 'Level 1');
      expect(isFolderBookmark(level1!)).toBe(true);
      if (isFolderBookmark(level1!)) {
        const [level2] = bookmarks.addFolder(level1.id, 'Level 2');
        expect(isFolderBookmark(level2!)).toBe(true);
        if (isFolderBookmark(level2!)) {
          const added = bookmarks.add(level2.id, null, [
            { title: 'Deep Bookmark', url: 'https://deep.com' },
          ]);
          expect(added).toHaveLength(1);
          const deepId = added[0].id;

          const deepBookmark = bookmarks.find(deepId);
          expect(deepBookmark).not.toBeNull();
          expect(isUrlBookmark(deepBookmark!)).toBe(true);
          if (isUrlBookmark(deepBookmark!)) {
            expect(deepBookmark.title).toBe('Deep Bookmark');
          }
        }
      }
    });
  });
});
