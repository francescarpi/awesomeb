import { Browser, bookmarks, notification, Window } from '@/core';
import { t } from '~/i18n';
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
      notification(t('notifications:bookmarkAdded.title'), t('notifications:bookmarkAdded.body'));
      browser.invalidateBookmarksMenuCache();
      browser.refreshMainMenu();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'bookmarks:get',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['bookmarks'])],
    async ({}) => {
      return browser.renderer.bookmarks();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ bookmarksList: IBookmark[] }>(
    'bookmarks:update',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['bookmarks'])],
    async ({ bookmarksList }) => {
      bookmarks.update(bookmarksList);
      notification(
        t('notifications:bookmarksUpdated.title'),
        t('notifications:bookmarksUpdated.body'),
      );
      browser.invalidateBookmarksMenuCache();
      browser.refreshMainMenu();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ bookmarkId: string }>(
    'bookmarks:open',
    'on',
    browser,
    [internalPageChecker.bind(null, ['bookmarks'])],
    async ({ bookmarkId }) => {
      const bookmark = bookmarks.find(bookmarkId);
      if (bookmark) {
        browser.openURL(bookmark.url, { selectTab: true });
      }
    },
  );
}
