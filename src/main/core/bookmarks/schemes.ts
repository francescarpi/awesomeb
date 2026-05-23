import { z } from 'zod';

// Url bookmark - leaf node
export const BookmarkUrlScheme = z
  .object({
    id: z.string(),
    type: z.literal('url'),
    url: z.string(),
    title: z.string(),
    dateAdded: z.number(),
  })
  .strict();

// Folder bookmark - recursive node
export const BookmarkFolderScheme = z
  .object({
    id: z.string(),
    type: z.literal('folder'),
    title: z.string(),
    children: z.lazy(() => BookmarkScheme.array()),
    dateAdded: z.number(),
  })
  .strict();

export const BookmarkScheme = z.union([BookmarkUrlScheme, BookmarkFolderScheme]);

export const BookmarksStoreScheme = z
  .object({
    bookmarks: z.array(BookmarkScheme),
  })
  .strict();

// Plain bookmark for presentation (not persisted)
export const PlainBookmarkScheme = z
  .object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    path: z.array(z.string()),
    folderId: z.string(),
  })
  .strict();

// Export inferred types
export type IUrlBookmark = z.infer<typeof BookmarkUrlScheme>;
export type IFolderBookmark = z.infer<typeof BookmarkFolderScheme>;
export type IBookmark = z.infer<typeof BookmarkScheme>;
export type IBookmarks = z.infer<typeof BookmarksStoreScheme>;
export type IPlainBookmark = z.infer<typeof PlainBookmarkScheme>;
