import Store from 'electron-store';
import { userDataPath } from '@/paths';
import type { IBookmarks } from './types';
import { EBookmarkType, IPlainBookmark, type IBookmark } from '~/types';

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
}
