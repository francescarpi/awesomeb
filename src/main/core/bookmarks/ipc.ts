import { Browser, bookmarks } from '@/core';
import { checkInternalPage, checkModalAndPagesSender } from '@/utils';
import { ipcMain } from 'electron';
import log from 'electron-log';
import { IBookmark, TWindowId } from '~/types';

const scopeLog = log.scope('BookmarksIPC');

export function setupBookmarksIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'bookmarks:add',
    async (
      event,
      winId: TWindowId,
      parentFolderId: string,
      title: string,
      url: string,
      newFolderName: string,
    ) => {
      scopeLog.info(`Add bookmark as a child of: ${parentFolderId}`);
      return await checkModalAndPagesSender(event, browser, winId, ['sidebar'], async (window) => {
        window.modal.close();
        bookmarks.add(
          parentFolderId,
          title,
          url,
          newFolderName.trim() === '' ? null : newFolderName,
        );
        window.notifications.show('Bookmark added successfully');
        browser.refreshMainMenu();
      });
    },
  );

  //--------------------------------------------------------------------------------------
  ipcMain.handle('bookmarks:get', async (event) => {
    scopeLog.info('Get bookmarks');
    return await checkInternalPage(
      event,
      browser,
      'bookmarks',
      async (_window, _desktop, _tabContainer, _tab) => {
        return browser.renderer.bookmarks();
      },
    );
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle('bookmarks:update', async (event, newList: IBookmark[]) => {
    scopeLog.info('Update bookmarks');
    return await checkInternalPage(
      event,
      browser,
      'bookmarks',
      async (window, _desktop, _tabContainer, _tab) => {
        bookmarks.update(newList);
        window.notifications.show('Bookmarks updated');
        browser.refreshMainMenu();
      },
    );
  });
}
