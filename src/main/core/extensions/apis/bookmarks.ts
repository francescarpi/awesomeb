import { Browser, bookmarks, Window } from '@/core';
import { type IBookmark, type IFolderBookmark, type IExtension, EBookmarkType } from '~/types';

export class ChromeBookmarks {
  constructor(_browser: Browser) {}

  async getTree(
    _window: Window,
    _extension: IExtension,
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const buildTree = (
      bookmarks: IBookmark[],
      parentId: string,
    ): chrome.bookmarks.BookmarkTreeNode[] => {
      return bookmarks
        .filter((b): b is IFolderBookmark => b.type === EBookmarkType.Folder)
        .map((folder) => ({
          id: folder.id,
          title: folder.title,
          children: buildTree(folder.children, folder.id),
          syncing: true,
          dateAdded: folder.dateAdded,
          parentId,
        }));
    };

    return [
      {
        id: '0',
        syncing: false,
        title: '',
        children: buildTree(bookmarks.all, '0'),
      },
    ];
  }

  async getSubTree(
    _window: Window,
    _extension: IExtension,
    id: string,
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const root = bookmarks.find(id);
    if (root) {
      return root;
    }
    return [];
  }

  async get(
    _window: Window,
    _extension: IExtension,
    idOrIdList: string | [string, ...string[]],
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const ids = typeof idOrIdList === 'string' ? [idOrIdList] : idOrIdList;
    const result: chrome.bookmarks.BookmarkTreeNode[] = [];

    for (const id of ids) {
      if (id === '0' || id === 'root________') {
        result.push({
          id: '0',
          syncing: false,
          title: '',
        });
        continue;
      }

      const found = bookmarks.find(id);
      if (found) {
        result.push({
          id: found.id,
          title: found.title,
          syncing: true,
          dateAdded: found.dateAdded,
        });
      }
    }

    return result;
  }
}
