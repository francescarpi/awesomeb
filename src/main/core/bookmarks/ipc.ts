import { Browser, bookmarks, notification, Window } from '@/core';
import { createHandler, windowChecker, internalPageChecker, modalChecker } from '@/utils';
import { IBookmark } from '~/types';

export function setupBookmarksIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{
    parentFolderId: string;
    title: string;
    url: string;
    newFolderName: string | null;
    win: Window;
  }>(
    'bookmarks:add',
    'on',
    browser,
    [windowChecker, modalChecker],
    async ({ parentFolderId, title, url, newFolderName, win }) => {
      bookmarks.add(parentFolderId, title, url, newFolderName);
      win.modal.close();
      notification('Bookmark Added', 'Bookmark added successfully');
      browser.refreshMainMenu();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'bookmarks:get',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'bookmarks')],
    async ({}) => {
      return browser.renderer.bookmarks();
    },
  );
  //--------------------------------------------------------------------------------------
  createHandler<{ bookmarksList: IBookmark[] }>(
    'bookmarks:update',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'bookmarks')],
    async ({ bookmarksList }) => {
      bookmarks.update(bookmarksList);
      notification('Bookmarks Updated', 'Bookmarks updated successfully');
      browser.refreshMainMenu();
    },
  );
}
