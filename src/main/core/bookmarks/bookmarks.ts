import Store from 'electron-store';
import { userDataPath } from '@/paths';
import { EBookmarkType, IPlainBookmark, type IBookmark, type IBookmarkEntry } from '~/types';
import { BookmarksStoreScheme, type IBookmarks } from './schemes';
import { validateStore } from '@/core/validation';
import { Browser } from '@/core';

export class Bookmarks {
  private readonly _store: Store<IBookmarks>;

  constructor(private readonly browser: Browser) {
    const defaults: IBookmarks = { bookmarks: [] };

    BookmarksStoreScheme.parse(defaults);

    this._store = new Store<IBookmarks>({
      name: 'bookmarks',
      cwd: userDataPath(),
      defaults,
    });

    this._store.store = validateStore(
      BookmarksStoreScheme,
      this._store.store,
      'Bookmarks',
      defaults,
    );
  }

  get all(): IBookmark[] {
    const data = this._store.get('bookmarks') || [];
    BookmarksStoreScheme.parse(this._store.store);
    return data;
  }

  get plainList(): IPlainBookmark[] {
    return this._generatePlainList();
  }

  find(id: string, bookmarks?: IBookmark[]): IBookmark | null {
    const items = bookmarks ?? this.all;

    for (const item of items) {
      if (item.id === id) return item;
      if (item.type === EBookmarkType.Folder) {
        const found = this.find(id, item.children);
        if (found) return found;
      }
    }
    return null;
  }

  add(folderId: string, newFolder: string | null, entries: IBookmarkEntry[]): IBookmark[] {
    const urlBookmarks = entries.map((entry) => this._createUrlBookmark(entry));
    const toAdd: IBookmark[] = newFolder
      ? [this._createFolder(newFolder, urlBookmarks)]
      : urlBookmarks;

    this._persist(this._insertIntoTree(this.all, folderId, toAdd));
    return toAdd;
  }

  addFolder(parentId: string, title: string): IBookmark[] {
    const folder = this._createFolder(title);
    this._persist(this._insertIntoTree(this.all, parentId, [folder]));
    return [folder];
  }

  update(bookmarks: IBookmark[]) {
    BookmarksStoreScheme.parse({ bookmarks });
    this._store.set('bookmarks', bookmarks);
    this.browser.eventsChannel.emit('bookmarks:bookmarks-did-change', this);
  }

  private _createUrlBookmark(entry: IBookmarkEntry): IBookmark {
    return {
      id: crypto.randomUUID(),
      type: EBookmarkType.Url,
      url: entry.url,
      title: entry.title,
      dateAdded: Date.now(),
    };
  }

  private _createFolder(title: string, children: IBookmark[] = []): IBookmark {
    return {
      id: crypto.randomUUID(),
      type: EBookmarkType.Folder,
      title,
      dateAdded: Date.now(),
      children,
    };
  }

  private _insertIntoTree(
    bookmarks: IBookmark[],
    parentId: string,
    items: IBookmark[],
  ): IBookmark[] {
    if (parentId === 'root') {
      return [...bookmarks, ...items];
    }

    if (this.find(parentId, bookmarks) === null) {
      throw new Error(`Bookmark folder not found: ${parentId}`);
    }

    const insert = (nodes: IBookmark[]): IBookmark[] =>
      nodes.map((node) => {
        if (node.type === EBookmarkType.Folder) {
          if (node.id === parentId) {
            return { ...node, children: [...node.children, ...items] };
          }
          return { ...node, children: insert(node.children) };
        }
        return node;
      });

    return insert(bookmarks);
  }

  private _persist(updatedBookmarks: IBookmark[]): void {
    BookmarksStoreScheme.parse({ bookmarks: updatedBookmarks });
    this._store.set('bookmarks', updatedBookmarks);
    this.browser.eventsChannel.emit('bookmarks:bookmarks-did-change', this);
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
          id: bookmark.id,
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
}
