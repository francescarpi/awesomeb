import Store from 'electron-store';
import { userDataPath } from '@/paths';
import { EBookmarkType, IPlainBookmark, type IBookmark } from '~/types';
import { BookmarksStoreScheme, type IBookmarks } from './schemes';
import { validateStore } from '@/core/validation';

export class Bookmarks {
  private readonly _store: Store<IBookmarks>;

  constructor() {
    const defaults: IBookmarks = { bookmarks: [] };

    // Validate defaults before passing to electron-store
    BookmarksStoreScheme.parse(defaults);

    this._store = new Store<IBookmarks>({
      name: 'bookmarks',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk, fall back to defaults if corrupted
    this._store.store = validateStore(
      BookmarksStoreScheme,
      this._store.store,
      'Bookmarks',
      defaults,
    );
  }

  get all(): IBookmark[] {
    const data = this._store.get('bookmarks') || [];
    // Validate the full store on read
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

  add(folderId: string, title: string, url: string, newFolder: string | null): boolean {
    const newBookmark: IBookmark = newFolder
      ? {
          id: crypto.randomUUID(),
          type: EBookmarkType.Folder,
          title: newFolder,
          dateAdded: Date.now(),
          children: [
            {
              id: crypto.randomUUID(),
              type: EBookmarkType.Url,
              url,
              title,
              dateAdded: Date.now(),
            },
          ],
        }
      : {
          id: crypto.randomUUID(),
          type: EBookmarkType.Url,
          url,
          title,
          dateAdded: Date.now(),
        };

    if (folderId === 'root') {
      const updatedBookmarks = [...this.all, newBookmark];
      BookmarksStoreScheme.parse({ bookmarks: updatedBookmarks });
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
    BookmarksStoreScheme.parse({ bookmarks: updatedBookmarks });
    this._store.set('bookmarks', updatedBookmarks);

    return true;
  }

  update(bookmarks: IBookmark[]) {
    BookmarksStoreScheme.parse({ bookmarks });
    this._store.set('bookmarks', bookmarks);
  }
}
