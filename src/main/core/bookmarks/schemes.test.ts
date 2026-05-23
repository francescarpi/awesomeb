import { expect, test, describe } from 'vitest';
import { BookmarkUrlScheme, BookmarkFolderScheme, BookmarksStoreScheme } from './schemes';
import { ZodError } from 'zod';

const validUrlBookmark = {
  id: 'url-1',
  type: 'url' as const,
  url: 'https://example.com',
  title: 'Example',
  dateAdded: 1234567890,
};

const validFolderBookmark = {
  id: 'folder-1',
  type: 'folder' as const,
  title: 'My Folder',
  children: [validUrlBookmark],
  dateAdded: 1234567890,
};

const validStore = {
  bookmarks: [validUrlBookmark, validFolderBookmark],
};

describe('BookmarkUrlScheme', () => {
  test('valid url bookmark parses', () => {
    expect(BookmarkUrlScheme.parse(validUrlBookmark)).toEqual(validUrlBookmark);
  });
  test('missing url throws', () => {
    const invalid = { ...validUrlBookmark, url: undefined };
    delete (invalid as Record<string, unknown>).url;
    expect(() => BookmarkUrlScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('BookmarkFolderScheme', () => {
  test('valid folder bookmark parses', () => {
    expect(BookmarkFolderScheme.parse(validFolderBookmark)).toEqual(validFolderBookmark);
  });
  test('nested children parse', () => {
    const nested = {
      ...validFolderBookmark,
      children: [validFolderBookmark],
    };
    expect(BookmarkFolderScheme.parse(nested)).toEqual(nested);
  });
});

describe('BookmarksStoreScheme', () => {
  test('valid store parses', () => {
    expect(BookmarksStoreScheme.parse(validStore)).toEqual(validStore);
  });
  test('extra property throws', () => {
    const invalid = { ...validStore, extra: true };
    expect(() => BookmarksStoreScheme.parse(invalid)).toThrow(ZodError);
  });
  test('invalid child type throws', () => {
    const invalid = {
      bookmarks: [{ ...validUrlBookmark, type: 'invalid' }],
    };
    expect(() => BookmarksStoreScheme.parse(invalid)).toThrow(ZodError);
  });
});
