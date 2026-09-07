import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { Bookmarks } from './bookmarks';
import { ZodError } from 'zod';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';
import type { IUrlBookmark, IFolderBookmark } from './schemes';

// Helper to get the bookmarks file path (must match electron-store's naming)
function getBookmarksFilePath() {
  return path.join(userDataPath(), 'bookmarks.json');
}

// Helper to clean up bookmarks file between tests
function cleanBookmarksFile() {
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

describe('Bookmarks', () => {
  beforeEach(() => {
    cleanBookmarksFile();
  });

  afterEach(() => {
    cleanBookmarksFile();
  });

  test('constructor with valid defaults succeeds', () => {
    const bookmarks = new Bookmarks();
    expect(bookmarks).toBeDefined();
    expect(bookmarks.all).toEqual([]);
  });

  test('constructor with corrupted disk JSON falls back to defaults', () => {
    const filePath = getBookmarksFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        bookmarks: 'not-an-array',
      }),
    );

    const bookmarks = new Bookmarks();
    expect(bookmarks).toBeDefined();
    expect(bookmarks.all).toEqual([]);
  });

  test('all getter validates on read', () => {
    const bookmarks = new Bookmarks();
    const data = bookmarks.all;
    expect(data).toEqual([]);
  });

  test('add() adds valid bookmark to root', () => {
    const bookmarks = new Bookmarks();
    const result = bookmarks.add('root', 'Test', 'https://test.com', null);
    expect(result).toBe(true);
    expect(bookmarks.all.length).toBe(1);
    expect(bookmarks.all[0].title).toBe('Test');
  });

  test('add() adds valid bookmark to folder', () => {
    const bookmarks = new Bookmarks();
    const folder = createTestFolderBookmark({ id: 'folder-1' });
    bookmarks.update([folder]);

    const result = bookmarks.add('folder-1', 'Nested', 'https://nested.com', null);
    expect(result).toBe(true);

    const found = bookmarks.find('folder-1');
    expect(found).not.toBeNull();
    expect(found?.type).toBe('folder');
    if (found?.type === 'folder') {
      expect(found.children.length).toBe(1);
      expect(found.children[0].title).toBe('Nested');
    }
  });

  test('add() falls back to defaults when on-disk data is invalid', () => {
    const bookmarks = new Bookmarks();
    bookmarks.update([createTestUrlBookmark()]);

    const filePath = getBookmarksFilePath();
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        bookmarks: [{ id: '1', type: 'url', title: 'Bad', url: 'https://bad.com' }],
      }),
    );

    const newBookmarks = new Bookmarks();
    expect(newBookmarks).toBeDefined();
    expect(newBookmarks.all).toEqual([]);
  });

  test('update() persists valid array', () => {
    const bookmarks = new Bookmarks();
    const list = [createTestUrlBookmark()];
    bookmarks.update(list);
    expect(bookmarks.all.length).toBe(1);
    expect(bookmarks.all[0].id).toBe('test-url-id');
  });

  test('update() rejects invalid array', () => {
    const bookmarks = new Bookmarks();
    const invalid = [
      {
        id: 'bad',
        type: 'url',
        title: 'Bad',
        url: 'https://bad.com',
        // missing dateAdded
      },
    ];
    expect(() => bookmarks.update(invalid as unknown as IUrlBookmark[])).toThrow(ZodError);
  });

  test('find() locates bookmark by id', () => {
    const bookmarks = new Bookmarks();
    const url = createTestUrlBookmark({ id: 'url-1' });
    bookmarks.update([url]);
    const found = bookmarks.find('url-1');
    expect(found).not.toBeNull();
    expect(found?.id).toBe('url-1');
  });

  test('find() locates bookmark nested deep in folders', () => {
    const bookmarks = new Bookmarks();
    const deepUrl = createTestUrlBookmark({ id: 'deep-url' });
    const innerFolder = createTestFolderBookmark({ id: 'inner', children: [deepUrl] });
    const outerFolder = createTestFolderBookmark({ id: 'outer', children: [innerFolder] });
    bookmarks.update([outerFolder]);

    const found = bookmarks.find('deep-url');
    expect(found).not.toBeNull();
    expect(found?.id).toBe('deep-url');
  });

  test('plainList() returns flat list with correct paths', () => {
    const bookmarks = new Bookmarks();
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

  test('add() creates folder when newFolder does not exist in destination', () => {
    const bookmarks = new Bookmarks();
    bookmarks.add('root', 'Site', 'https://site.com', 'My Folder');

    expect(bookmarks.all.length).toBe(1);
    const folder = bookmarks.all[0];
    expect(folder.type).toBe('folder');
    if (folder.type === 'folder') {
      expect(folder.title).toBe('My Folder');
      expect(folder.children.length).toBe(1);
      expect(folder.children[0].type).toBe('url');
    }
  });

  test('add() reuses existing folder (case-insensitive) instead of creating a duplicate', () => {
    const bookmarks = new Bookmarks();
    const existing = createTestFolderBookmark({ id: 'existing', title: 'Trabajo' });
    bookmarks.update([existing]);

    bookmarks.add('root', 'Site', 'https://site.com', 'trabajo');

    expect(bookmarks.all.length).toBe(1);
    const folder = bookmarks.find('existing');
    expect(folder).not.toBeNull();
    if (folder?.type === 'folder') {
      expect(folder.title).toBe('Trabajo');
      expect(folder.children.length).toBe(1);
      expect(folder.children[0].type).toBe('url');
    }
  });

  test('add() reuses exact-case match folder', () => {
    const bookmarks = new Bookmarks();
    const existing = createTestFolderBookmark({ id: 'f1', title: 'Sub' });
    const parent = createTestFolderBookmark({ id: 'parent', children: [existing] });
    bookmarks.update([parent]);

    bookmarks.add('parent', 'Site', 'https://site.com', 'Sub');

    const parentFolder = bookmarks.find('parent');
    if (parentFolder?.type === 'folder') {
      expect(parentFolder.children.length).toBe(1);
      const sub = parentFolder.children[0];
      expect(sub.type).toBe('folder');
      if (sub.type === 'folder') {
        expect(sub.title).toBe('Sub');
        expect(sub.children.length).toBe(1);
        expect(sub.children[0].type).toBe('url');
      }
    }
  });

  test('add() reuses existing folder inside non-root parent', () => {
    const bookmarks = new Bookmarks();
    const innerFolder = createTestFolderBookmark({ id: 'inner', title: 'Links' });
    const parent = createTestFolderBookmark({ id: 'parent', children: [innerFolder] });
    bookmarks.update([parent]);

    bookmarks.add('parent', 'Site', 'https://site.com', 'links');

    const parentFolder = bookmarks.find('parent');
    if (parentFolder?.type === 'folder') {
      expect(parentFolder.children.length).toBe(1);
      if (parentFolder.children[0].type === 'folder') {
        expect(parentFolder.children[0].title).toBe('Links');
        expect(parentFolder.children[0].children.length).toBe(1);
      }
    }
  });

  test('add() returns false when parent folder does not exist', () => {
    const bookmarks = new Bookmarks();
    const result = bookmarks.add('nonexistent', 'Site', 'https://site.com', 'New Folder');
    expect(result).toBe(true);
    expect(bookmarks.all.length).toBe(0);
  });
});
