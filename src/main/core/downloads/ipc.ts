import { Browser, Window } from '@/core';
import { ipcMain } from 'electron';
import { TWindowId } from '~/types';
import log from 'electron-log';
import {
  checkInternalPage,
  checkModalAndPagesSender,
  createHandler,
  windowChecker,
  viewChecker,
} from '@/utils';
import { INTERNAL_PROTOCOL } from '~/constants';

const scopeLog = log.scope('DownloadsIPC');

export function setupDownloadsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'downloads:open-page',
    'on',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar', 'contextual-modal'])],
    async ({ win }) => {
      win.closeContextualModal();

      let downloadsFound = false;

      for (const tabData of win.tabs) {
        if (tabData.tab.url === `${INTERNAL_PROTOCOL}://downloads/`) {
          win.selectTab(tabData.tab.id);
          downloadsFound = true;
          break;
        }
      }

      if (!downloadsFound) {
        browser.openURL(`${INTERNAL_PROTOCOL}://downloads/`, { selectTab: true });
      }
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{}>('downloads:action', 'on', browser, [], async ({}) => {});

  ipcMain.on(
    'downloads:action',
    async (
      event,
      savePath: string,
      action: 'cancel' | 'pause' | 'resume' | 'open',
      winId?: TWindowId,
    ) => {
      scopeLog.info(`Cancel download received for save path ${savePath}`);

      const performAction = () => {
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
      };

      if (winId) {
        return await checkModalAndPagesSender(
          event,
          browser,
          winId,
          ['contextual-modal'],
          async (_window) => {
            return performAction();
          },
        );
      }

      return await checkInternalPage(event, browser, 'downloads', async (_window) => {
        return performAction();
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
        ['contextual-modal'],
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
