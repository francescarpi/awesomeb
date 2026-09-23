import { Browser, bookmarks, Window } from '@/core';
import { EBookmarkType, type IBookmark, type IExtension } from '~/types';
import { t } from '~/i18n';

const ROOT_ID = '0';
const BOOKMARKS_BAR_ID = '1';
const OTHER_ID = '2';

export class ChromeBookmarks {
  constructor(private readonly _browser: Browser) {}

  private findTreeNode(
    id: string,
    tree: chrome.bookmarks.BookmarkTreeNode[],
  ): chrome.bookmarks.BookmarkTreeNode[] {
    for (const node of tree) {
      if (node.id === id && node.children) {
        return [node];
      } else if (node.children && node.children.length > 0) {
        return this.findTreeNode(id, node.children);
      }
    }
    return [];
  }

  private flattenTreeNode(
    tree: chrome.bookmarks.BookmarkTreeNode[],
    originalList?: chrome.bookmarks.BookmarkTreeNode[],
  ): chrome.bookmarks.BookmarkTreeNode[] {
    const list = originalList || [];
    for (const node of tree) {
      const { children, ...nodeWithoutChildren } = node;
      list.push(nodeWithoutChildren);

      if (children && children.length > 0) {
        this.flattenTreeNode(children, list);
      }
    }
    return list;
  }

  private iBookmarkToTreeNode(
    bookmark: IBookmark,
    parentId: string,
  ): chrome.bookmarks.BookmarkTreeNode {
    return {
      id: bookmark.id,
      title: bookmark.title,
      syncing: false,
      dateAdded: bookmark.dateAdded,
      url: bookmark.url,
      parentId,
      ...(bookmark.type !== EBookmarkType.Url && {
        children: this.buildTree(bookmark.children, bookmark.id),
      }),
    };
  }
  private buildTree(bookmarks: IBookmark[], parentId: string): chrome.bookmarks.BookmarkTreeNode[] {
    if (!bookmarks) {
      return [];
    }

    return bookmarks.map((bk) => this.iBookmarkToTreeNode(bk, parentId));
  }

  async getTree(
    _window: Window,
    _extension: IExtension,
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return [
      {
        id: ROOT_ID,
        syncing: false,
        title: '',
        children: [
          {
            id: BOOKMARKS_BAR_ID,
            folderType: 'bookmarks-bar',
            parentId: ROOT_ID,
            syncing: false,
            title: t('pages:extensions.bookmarksBar'),
            children: [],
          },
          {
            id: OTHER_ID,
            folderType: 'other',
            parentId: ROOT_ID,
            syncing: false,
            title: t('pages:extensions.otherBookmarks'),
            children: this.buildTree(bookmarks.all, ROOT_ID),
          },
        ],
      },
    ];
  }

  async getSubTree(
    window: Window,
    extension: IExtension,
    id: string,
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const tree = await this.getTree(window, extension);

    const result = this.findTreeNode(id, tree);
    return result;
  }

  async get(
    window: Window,
    extension: IExtension,
    idOrIdList: string | [string, ...string[]],
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const ids = (typeof idOrIdList === 'string' ? [idOrIdList] : idOrIdList).map((id) =>
      id === 'root________' ? '0' : id,
    );
    const flatTree = this.flattenTreeNode(await this.getTree(window, extension));
    const result = flatTree.filter((node) => ids.includes(node.id));
    return result;
  }

  async create(
    _window: Window,
    _extension: IExtension,
    bookmark: chrome.bookmarks.CreateDetails,
  ): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
    const { parentId, title, url } = bookmark;
    if (!parentId || !title) {
      return null;
    }

    const isFolder = url === undefined;
    const pId = [ROOT_ID, BOOKMARKS_BAR_ID, OTHER_ID].includes(parentId) ? 'root' : parentId;

    const newBookmark = isFolder
      ? bookmarks.addFolder(pId, title)
      : bookmarks.add(pId, null, [{ title, url }]);

    this._browser.invalidateBookmarksMenuCache();
    this._browser.refreshMainMenu();

    return this.iBookmarkToTreeNode(newBookmark, pId);
  }
}
