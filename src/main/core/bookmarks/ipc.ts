import { Browser, bookmarks } from '@/core';
import { checkModalAndPagesSender } from '@/utils';
import { ipcMain } from 'electron';
import log from 'electron-log';
import { TWindowId } from '~/types';

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
}
