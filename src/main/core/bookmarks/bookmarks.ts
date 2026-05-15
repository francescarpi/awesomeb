import Store from 'electron-store';
import { userDataPath } from '@/paths';
import type { IBookmarks } from './types';
import {
  EBookmarkType,
  IPlainBookmark,
  type IBookmark,
  type IUrlBookmark,
  type IFolderBookmark,
} from '~/types';
import {
  flattenAll,
  findNode,
  insertInFolder,
  removeFromTree,
  extractFromTree,
  applyUpdate,
  touchFolder,
  type IBookmarkEntry,
} from './helpers';

export class Bookmarks {
  private readonly _store: Store<IBookmarks>;

  constructor() {
    this._store = new Store<IBookmarks>({
      name: 'bookmarks',
      cwd: userDataPath(),
      defaults: {
        bookmarks: [],
      },
    });
  }

  get all(): IBookmark[] {
    return this._store.get('bookmarks') || [];
  }

  get plainList(): IPlainBookmark[] {
    return this._generatePlainList();
  }

  private _generatePlainList(
    initialBookmarks?: IBookmark[],
    initialUrls?: IPlainBookmark[],
    folderId?: string,
    parentPath: string[] = [],
  ): IPlainBookmark[] {
    const urls = initialUrls || [];
    const bookmarks = initialBookmarks || this.all;

    for (const bookmark of bookmarks) {
      if (bookmark.type === EBookmarkType.Url) {
        urls.push({
          name: bookmark.title,
          url: bookmark.url,
          path: parentPath,
          folderId: folderId as string,
        });
      } else {
        this._generatePlainList(bookmark.children, urls, bookmark.id, [
          ...parentPath,
          bookmark.title,
        ]);
      }
    }
    return urls;
  }

  add(folderId: string, title: string, url: string, newFolder: string | null): boolean {
    const newBookmark: IBookmark = newFolder
      ? {
          id: crypto.randomUUID(),
          type: EBookmarkType.Folder,
          title: newFolder,
          children: [
            {
              id: crypto.randomUUID(),
              type: EBookmarkType.Url,
              url,
              title,
            },
          ],
        }
      : {
          id: crypto.randomUUID(),
          type: EBookmarkType.Url,
          url,
          title,
        };

    if (folderId === 'root') {
      const updatedBookmarks = [...this.all, newBookmark];
      this._store.set('bookmarks', updatedBookmarks);
      return true;
    }

    const addBookmarkToFolder = (bookmarks: IBookmark[]): IBookmark[] => {
      return bookmarks.map((bookmark) => {
        if (bookmark.type === EBookmarkType.Folder) {
          if (bookmark.id === folderId) {
            return {
              ...bookmark,
              children: [...bookmark.children, newBookmark],
            };
          } else {
            return {
              ...bookmark,
              children: addBookmarkToFolder(bookmark.children),
            };
          }
        }
        return bookmark;
      });
    };

    const updatedBookmarks = addBookmarkToFolder(this.all);
    this._store.set('bookmarks', updatedBookmarks);

    return true;
  }

  update(bookmarks: IBookmark[]) {
    this._store.set('bookmarks', bookmarks);
  }

  // ---------------------------------------------------------------------------
  // Extension API methods
  // ---------------------------------------------------------------------------

  createChromeBookmark(details: {
    parentId?: string;
    index?: number;
    title: string;
    url?: string;
  }): IBookmark | null {
    const now = Date.now();
    const isFolder = !details.url;

    const newBookmark: IBookmark = isFolder
      ? {
          id: crypto.randomUUID(),
          type: EBookmarkType.Folder,
          title: details.title,
          children: [],
          dateAdded: now,
          dateGroupModified: now,
        }
      : {
          id: crypto.randomUUID(),
          type: EBookmarkType.Url,
          url: details.url!,
          title: details.title,
          dateAdded: now,
        };

    const parentId = details.parentId || 'root';
    const insertAt = details.index ?? -1;

    if (parentId === 'root') {
      const all = this.all;
      if (insertAt >= 0 && insertAt < all.length) {
        all.splice(insertAt, 0, newBookmark);
      } else {
        all.push(newBookmark);
      }
      this._store.set('bookmarks', all);
      return newBookmark;
    }

    const updated = insertInFolder(this.all, parentId, newBookmark, insertAt);
    if (!updated) return null;
    this._store.set('bookmarks', updated);
    return newBookmark;
  }

  removeById(id: string): boolean {
    const all = this.all;
    const rootIndex = all.findIndex((b) => b.id === id);
    if (rootIndex !== -1) {
      all.splice(rootIndex, 1);
      this._store.set('bookmarks', all);
      return true;
    }

    const updated = removeFromTree(all, id);
    if (updated) {
      this._store.set('bookmarks', updated);
      return true;
    }
    return false;
  }

  moveBookmark(id: string, destination: { parentId?: string; index?: number }): IBookmark | null {
    let all = this.all;
    const rootIndex = all.findIndex((b) => b.id === id);

    let movedNode: IBookmark;
    if (rootIndex !== -1) {
      movedNode = all.splice(rootIndex, 1)[0];
    } else {
      const result = extractFromTree(all, id);
      if (!result) return null;
      all = result.tree;
      movedNode = result.node;
    }

    const parentId = destination.parentId ?? null;
    const insertAt = destination.index ?? -1;

    if (!parentId || parentId === 'root') {
      if (insertAt >= 0 && insertAt <= all.length) {
        all.splice(insertAt, 0, movedNode);
      } else {
        all.push(movedNode);
      }
    } else {
      const inserted = insertInFolder(all, parentId, movedNode, insertAt);
      if (!inserted) return null;
      all = inserted;
      all = touchFolder(all, parentId);
    }

    this._store.set('bookmarks', all);
    return movedNode;
  }

  updateBookmark(id: string, changes: { title?: string; url?: string }): IBookmark | null {
    let updated: IBookmark | null = null;

    const newTree = applyUpdate(this.all, id, changes, (node) => {
      updated = node;
    });

    if (!updated) return null;
    this._store.set('bookmarks', newTree);
    return updated;
  }

  searchBookmarks(query: string): IBookmark[] {
    const lowerQuery = query.toLowerCase();
    return structuredClone(
      flattenAll(this.all)
        .filter(({ bookmark }) => {
          const b = bookmark;
          return (
            b.title.toLowerCase().includes(lowerQuery) ||
            (b.type === EBookmarkType.Url &&
              (b as IUrlBookmark).url.toLowerCase().includes(lowerQuery))
          );
        })
        .map(({ bookmark }) => bookmark),
    );
  }

  getSubTree(id: string): IBookmark[] {
    const node = findNode(this.all, id);
    if (!node) return [];
    return [structuredClone(node)];
  }

  getChildren(id: string): IBookmark[] {
    const node = findNode(this.all, id);
    if (!node || node.type !== EBookmarkType.Folder) return [];
    return structuredClone((node as IFolderBookmark).children);
  }

  getRecent(count: number): IBookmarkEntry[] {
    const flat = flattenAll(this.all);
    return flat
      .filter((entry) => entry.bookmark.type === EBookmarkType.Url)
      .sort(
        (a, b) =>
          ((b.bookmark as IUrlBookmark).dateAdded ?? 0) -
          ((a.bookmark as IUrlBookmark).dateAdded ?? 0),
      )
      .slice(0, count);
  }
}
