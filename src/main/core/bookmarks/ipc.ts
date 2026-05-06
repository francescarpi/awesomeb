import { Browser, bookmarks, notification } from '@/core';
import { createHandler, windowChecker, viewChecker, internalPageChecker } from '@/utils';
import { IBookmark } from '~/types';

export function setupBookmarksIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{
    parentFolderId: string;
    title: string;
    url: string;
    newFolderName: string;
  }>(
    'bookmarks:add',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, 'sidebar')],
    async ({ parentFolderId, title, url, newFolderName }) => {
      bookmarks.add(parentFolderId, title, url, newFolderName.trim() === '' ? null : newFolderName);
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
