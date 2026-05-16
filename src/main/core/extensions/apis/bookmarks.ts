import { Browser, Window } from '@/core';
import { bookmarks } from '@/core/bookmarks';
import { flattenAll } from '@/core/bookmarks/helpers';
import { TExtensionId, TPartitionId } from '~/types';
import { EBookmarkType, type IBookmark, type IFolderBookmark, type IUrlBookmark } from '~/types';

export class ChromeBookmarks {
  constructor(_browser: Browser) {
    void _browser;
  }

  async getTree(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    _props: Record<string, never>,
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return bookmarkTreeToChrome(bookmarks.all);
  }

  async getSubTree(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: { id: string },
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const subtree = bookmarks.getSubTree(props.id);
    if (subtree.length === 0) return [];
    return bookmarkTreeToChrome(subtree);
  }

  async getChildren(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: { id: string },
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const children = bookmarks.getChildren(props.id);
    return bookmarkTreeToChrome(children);
  }

  async getRecent(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: { numberOfItems: number },
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const entries = bookmarks.getRecent(props.numberOfItems);
    return entries.map((entry) =>
      bookmarkToChromeNode(entry.bookmark, entry.parentId, entry.index),
    );
  }

  async search(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: { query: string },
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const results = bookmarks.searchBookmarks(props.query);
    return enrichWithPosition(results);
  }

  async create(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: chrome.bookmarks.CreateDetails,
  ): Promise<chrome.bookmarks.BookmarkTreeNode | undefined> {
    const created = bookmarks.createChromeBookmark({
      parentId: props.parentId,
      index: props.index,
      title: props.title ?? '',
      url: props.url,
    });
    if (!created) return undefined;
    return enrichSingle(created);
  }

  async move(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: { id: string; destination: chrome.bookmarks.MoveDestination },
  ): Promise<chrome.bookmarks.BookmarkTreeNode | undefined> {
    const moved = bookmarks.moveBookmark(props.id, {
      parentId: props.destination.parentId,
      index: props.destination.index,
    });
    if (!moved) return undefined;
    return enrichSingle(moved);
  }

  async update(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: { id: string; changes: chrome.bookmarks.UpdateChanges },
  ): Promise<chrome.bookmarks.BookmarkTreeNode | undefined> {
    const updated = bookmarks.updateBookmark(props.id, {
      title: props.changes.title,
      url: props.changes.url,
    });
    if (!updated) return undefined;
    return enrichSingle(updated);
  }

  async remove(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: { id: string },
  ): Promise<void> {
    bookmarks.removeById(props.id);
  }

  async removeTree(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: { id: string },
  ): Promise<void> {
    bookmarks.removeById(props.id);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bookmarkToChromeNode(
  bookmark: IBookmark,
  parentId: string | null,
  index: number,
): chrome.bookmarks.BookmarkTreeNode {
  const base = {
    id: bookmark.id,
    title: bookmark.title,
    dateAdded: (bookmark as { dateAdded?: number }).dateAdded ?? undefined,
    parentId: parentId ?? undefined,
    index,
  };

  if (bookmark.type === EBookmarkType.Url) {
    return {
      ...base,
      url: (bookmark as IUrlBookmark).url,
      syncing: false,
    };
  }

  const folder = bookmark as IFolderBookmark;
  return {
    ...base,
    dateGroupModified: folder.dateGroupModified ?? undefined,
    syncing: false,
    children: folder.children.map((child, i) => bookmarkToChromeNode(child, bookmark.id, i)),
  };
}

function bookmarkTreeToChrome(list: IBookmark[]): chrome.bookmarks.BookmarkTreeNode[] {
  return [
    {
      id: '0',
      title: '',
      syncing: false,
      children: list.map((bookmark, index) => bookmarkToChromeNode(bookmark, null, index)),
    },
  ];
}

function enrichWithPosition(results: IBookmark[]): chrome.bookmarks.BookmarkTreeNode[] {
  const flat = flattenAll(bookmarks.all);
  const flatMap = new Map<string, { parentId: string | null; index: number }>();
  for (const entry of flat) {
    flatMap.set(entry.bookmark.id, { parentId: entry.parentId, index: entry.index });
  }

  return results.map((bookmark) => {
    const pos = flatMap.get(bookmark.id);
    return bookmarkToChromeNode(bookmark, pos?.parentId ?? null, pos?.index ?? 0);
  });
}

function enrichSingle(bookmark: IBookmark): chrome.bookmarks.BookmarkTreeNode {
  const flat = flattenAll(bookmarks.all);
  const entry = flat.find((e) => e.bookmark.id === bookmark.id);
  return bookmarkToChromeNode(bookmark, entry?.parentId ?? null, entry?.index ?? 0);
}
