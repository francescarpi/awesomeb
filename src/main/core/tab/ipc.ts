import { Browser } from '@/core';
import { checkFailLoadSender, checkFindInPageSender, checkModalAndPagesSender } from '@/utils';
import { FindInPageOptions, ipcMain } from 'electron';
import { TFindInPageAction, TTabId, TWindowId } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('TabIPC');

export function setupTabIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('tabs:get-tab-containers', async (event, winId: TWindowId) => {
    scopeLog.info(`IPC tabs:get-tab-containers received for window ${winId}`);
    return await checkModalAndPagesSender(event, browser, winId, ['sidebar'], async (window) => {
      return await browser.renderer.tabContainers(window);
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('tabs:close-find-in-tab', async (event, tabId: TTabId) => {
    scopeLog.info(`IPC tabs:close-find-in-tab received for tab ${tabId}`);
    return await checkFindInPageSender(event, browser, tabId, async (tab, _findInPage) => {
      tab.view.webContents.stopFindInPage('clearSelection');
      tab.stopFindInPage();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle(
    'tabs:find-in-page-action',
    async (event, tabId: TTabId, action: TFindInPageAction, query: string) => {
      scopeLog.info(
        `IPC tabs:find-in-page-action received for tab ${tabId} with action ${action} and query "${query}"`,
      );
      return await checkFindInPageSender(event, browser, tabId, async (tab, findInPage) => {
        const wc = tab.view.webContents;

        if (query.trim() === '') {
          wc.stopFindInPage('clearSelection');
          return null;
        }

        const options: FindInPageOptions = {};
        if (action === 'next') {
          options.findNext = true;
        } else if (action === 'previous') {
          options.forward = false;
        } else {
          options.forward = true;
        }

        const requestId = wc.findInPage(query, options);
        findInPage.addSearch(requestId, query, action);
        return requestId;
      });
    },
  );

  //--------------------------------------------------------------------------------------
  ipcMain.on('tabs:retry-failed', async (event, tabId: TTabId) => {
    scopeLog.info(`IPC tabs:retry-failed received for tab ${tabId}`);
    return await checkFailLoadSender(event, browser, tabId, async (tab, _failLoad) => {
      tab.clearFailLoad();
      tab.view.webContents.reload();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'tabs:login',
    async (
      event,
      winId: TWindowId,
      tabId: TTabId,
      data: { username: string; password: string } | null,
    ) => {
      scopeLog.info(`IPC tabs:login received for window ${winId} and tab ${tabId}`);
      return await checkModalAndPagesSender(event, browser, winId, [], async (window) => {
        const tabData = window.getTab(tabId);
        if (!tabData) {
          scopeLog.warn(`Login IPC: Tab ${tabId} not found in window ${winId}`);
          return;
        }

        const tab = tabData.tab;
        if (!tab.basicAuthCallback) {
          scopeLog.warn(
            `Login IPC: Tab ${tabId} in window ${winId} does not have a basicAuthCallback set`,
          );
          return;
        }

        if (data) {
          tab.basicAuthCallback(data.username, data.password);
        } else {
          tab.basicAuthCallback();
        }

        window.modal.close();
      });
    },
  );
}
