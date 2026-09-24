import log from 'electron-log';
import { Browser, Window, partitions } from '@/core';
import { ExtensionPopup } from '../popup';
import { EBookmarkType, type IBookmark, type IExtension } from '~/types';
import type { BookmarksChangePayload } from '@/core/bookmarks/types';
import { t } from '~/i18n';

const ROOT_ID = '0';
const BOOKMARKS_BAR_ID = '1';
const OTHER_ID = '2';

const scopeLog = log.scope('ChromeBookmarks');

export class ChromeBookmarks {
  constructor(private readonly browser: Browser) {}

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
            children: this.buildTree(this.browser.bookmarks.all, OTHER_ID),
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
    idOrIdList?: string | [string, ...string[]] | null,
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const flatTree = this.flattenTreeNode(await this.getTree(window, extension));

    if (idOrIdList == null) {
      return flatTree;
    }

    const ids = (typeof idOrIdList === 'string' ? [idOrIdList] : idOrIdList).map((id) =>
      id === 'root________' ? '0' : id,
    );
    return flatTree.filter((node) => ids.includes(node.id));
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

    const newBookmarks = isFolder
      ? this.browser.bookmarks.addFolder(pId, title)
      : this.browser.bookmarks.add(pId, null, [{ title, url }]);

    this.browser.invalidateBookmarksMenuCache();
    this.browser.refreshMainMenu();

    const created = newBookmarks[0];
    if (!created) {
      return null;
    }

    return this.iBookmarkToTreeNode(created, parentId);
  }

  notifyChanged(payload: BookmarksChangePayload): void {
    if (payload.kind === 'created') {
      const mappedParentId = payload.parentId === 'root' ? OTHER_ID : payload.parentId;

      for (const item of payload.items) {
        const treeNode = this.iBookmarkToTreeNode(item, mappedParentId);
        this.broadcastToExtensions('bookmarks.onCreated', {
          id: treeNode.id,
          bookmark: treeNode,
        });
      }
      return;
    }

    const oldTree = payload.previousTree;
    const newTree = payload.tree;

    const oldIds = this._collectIds(oldTree);
    const newIds = this._collectIds(newTree);

    for (const id of newIds) {
      if (oldIds.has(id)) {
        continue;
      }
      const node = this._findById(newTree, id);
      if (!node) {
        continue;
      }
      const parentId = this._findParentId(newTree, id) ?? OTHER_ID;
      const treeNode = this.iBookmarkToTreeNode(node, parentId);
      this.broadcastToExtensions('bookmarks.onCreated', {
        id,
        bookmark: treeNode,
      });
    }

    for (const id of oldIds) {
      if (newIds.has(id)) {
        continue;
      }
      const node = this._findById(oldTree, id);
      if (!node) {
        continue;
      }
      const parentId = this._findParentId(oldTree, id) ?? OTHER_ID;
      const treeNode = this.iBookmarkToTreeNode(node, parentId);
      this.broadcastToExtensions('bookmarks.onRemoved', {
        id,
        removeInfo: { parentId, index: 0, node: treeNode },
      });
    }
  }

  private _collectIds(tree: IBookmark[]): Set<string> {
    const ids = new Set<string>();
    const walk = (nodes: IBookmark[]): void => {
      for (const n of nodes) {
        ids.add(n.id);
        if (n.type === EBookmarkType.Folder) {
          walk(n.children);
        }
      }
    };
    walk(tree);
    return ids;
  }

  private _findById(tree: IBookmark[], id: string): IBookmark | null {
    for (const node of tree) {
      if (node.id === id) {
        return node;
      }
      if (node.type === EBookmarkType.Folder) {
        const found = this._findById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private _findParentId(tree: IBookmark[], id: string): string | null {
    for (const node of tree) {
      if (node.type === EBookmarkType.Folder) {
        if (node.children.some((c) => c.id === id)) {
          return node.id;
        }
        const found = this._findParentId(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private broadcastToExtensions(eventName: string, params: object): void {
    const channel = `extensions:crx-event:${eventName}`;
    const args = [params];

    let popupCount = 0;
    let workerCount = 0;

    for (const win of this.browser.windows) {
      const popup = win.getView<ExtensionPopup>('extension-popup');
      if (!popup || popup.webContents.isDestroyed()) {
        continue;
      }
      try {
        popup.webContents.send(channel, ...args);
        popupCount++;
      } catch (err) {
        scopeLog.warn(`Failed to send ${eventName} to popup in window ${win.winId}:`, err);
      }
    }

    for (const partition of partitions.allForExtensions) {
      const serviceWorkers = partition.ses.serviceWorkers;
      for (const versionId of Object.keys(serviceWorkers.getAllRunning())) {
        const sw = serviceWorkers.getWorkerFromVersionID(Number(versionId));
        if (!sw || sw.isDestroyed()) {
          continue;
        }
        try {
          sw.send(channel, ...args);
          workerCount++;
        } catch (err) {
          scopeLog.warn(`Failed to send ${eventName} to service worker ${sw.versionId}:`, err);
        }
      }
    }

    if (popupCount > 0 || workerCount > 0) {
      scopeLog.info(
        `Broadcast ${eventName}: ${popupCount} popup(s), ${workerCount} service worker(s)`,
      );
    }
  }
}
