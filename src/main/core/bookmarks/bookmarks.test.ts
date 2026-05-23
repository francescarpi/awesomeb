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

  test('constructor with corrupted disk JSON throws ZodError', () => {
    const filePath = getBookmarksFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        bookmarks: 'not-an-array',
      }),
    );

    expect(() => new Bookmarks()).toThrow(ZodError);
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

  test('add() rejects if resulting structure is invalid', () => {
    const bookmarks = new Bookmarks();
    // Seed with valid data first
    bookmarks.update([createTestUrlBookmark()]);

    // Manually corrupt the file on disk to simulate invalid state
    const filePath = getBookmarksFilePath();
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        bookmarks: [{ id: '1', type: 'url', title: 'Bad', url: 'https://bad.com' }],
      }),
    );

    // Creating a new instance should throw because the on-disk data is invalid
    // (missing dateAdded on the bookmark)
    expect(() => new Bookmarks()).toThrow(ZodError);
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
});
