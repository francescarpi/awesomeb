import { Browser, bookmarks, Window } from '@/core';
import { type IBookmark, type IExtension } from '~/types';
import { t } from '~/i18n';

const ROOT_ID = '0';
const BOOKMARKS_BAR_ID = '1';
const OTHER_ID = '2';

export class ChromeBookmarks {
  constructor(_browser: Browser) {}

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

  async getTree(
    _window: Window,
    _extension: IExtension,
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const buildTree = (
      bookmarks: IBookmark[],
      parentId: string,
    ): chrome.bookmarks.BookmarkTreeNode[] => {
      if (!bookmarks) {
        return [];
      }
      return bookmarks.map((folder) => ({
        id: folder.id,
        title: folder.title,
        children: buildTree(folder.children, folder.id),
        syncing: true,
        dateAdded: folder.dateAdded,
        url: folder.url,
        parentId,
      }));
    };

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
            children: buildTree(bookmarks.all, ROOT_ID),
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
}
