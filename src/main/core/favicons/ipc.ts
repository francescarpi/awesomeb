import { ipcMain } from 'electron';
import log from 'electron-log';
import { Browser, getCachedFavicon } from '@/core';
import { TTabId, TWindowId } from '~/types';
import { checkModalAndPagesSender } from '@/utils';

const scopeLog = log.scope('FaviconsIPC');

export function setupFaviconsIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('favicons:get', async (event, winId: TWindowId, tabId: TTabId) => {
    scopeLog.info(`Get favicon for tab ${tabId} in window ${winId}`);
    return await checkModalAndPagesSender(
      event,
      browser,
      winId,
      ['sidebar', 'tab-switcher'],
      async (window) => {
        const tabData = window.getTab(tabId);
        if (!tabData) {
          scopeLog.error(`No tab found with ID ${tabId} in window ${winId}`);
          return null;
        }

        if (tabData.tab.favicon) {
          return tabData.tab.favicon;
        }

        if (tabData.tab.url) {
          return await getCachedFavicon(tabData.tab.url);
        }

        return null;
      },
    );
  });
}
