import { Browser } from '@/core';
import { ipcMain } from 'electron';
import { TWindowId } from '~/types';
import log from 'electron-log';
import { checkInternalPage, checkModalAndPagesSender } from '@/utils';
import { INTERNAL_PROTOCOL } from '~/constants';

const scopeLog = log.scope('DownloadsIPC');

export function setupDownloadsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('downloads:open-page', async (event, winId: TWindowId) => {
    scopeLog.info(`Open-page received for window ${winId}`);
    return await checkModalAndPagesSender(
      event,
      browser,
      winId,
      ['sidebar', 'contextual-modal'],
      async (window) => {
        window.closeContextualModal();

        let downloadsFound = false;

        for (const tabData of window.tabs) {
          if (tabData.tab.url === `${INTERNAL_PROTOCOL}://downloads/`) {
            window.selectTab(tabData.tab.id);
            downloadsFound = true;
            break;
          }
        }

        if (!downloadsFound) {
          browser.openURL(`${INTERNAL_PROTOCOL}://downloads/`, { selectTab: true });
        }
      },
    );
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'downloads:action',
    async (event, savePath: string, action: 'cancel' | 'pause' | 'resume' | 'open') => {
      scopeLog.info(`Cancel download received for save path ${savePath}`);
      return await checkInternalPage(event, browser, 'downloads', async (_window) => {
        const downloadItem = browser.downloads.get(savePath);
        if (!downloadItem) {
          scopeLog.warn(`No download item found for save path ${savePath}`);
          return;
        }

        switch (action) {
          case 'cancel':
            downloadItem.cancel();
            break;
          case 'pause':
            downloadItem.pause();
            break;
          case 'resume':
            downloadItem.resume();
            break;
          case 'open':
            downloadItem.open();
            break;
        }
      });
    },
  );

  //--------------------------------------------------------------------------------------
  ipcMain.handle('downloads:get', async (event, winId?: TWindowId) => {
    scopeLog.info(`Get downloads received`);
    if (winId) {
      return await checkModalAndPagesSender(
        event,
        browser,
        winId,
        ['sidebar', 'contextual-modal'],
        async (_window) => {
          return browser.renderer.downloads();
        },
      );
    }
    return await checkInternalPage(event, browser, 'downloads', async (_window) => {
      return browser.renderer.downloads();
    });
  });
}
