import { Browser } from '@/core';
import { checkModalAndPagesSender } from '@/utils';
import { ipcMain } from 'electron';
import { TTabId, TWindowId } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('TabIPC');

export function setupTabIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('tabs:get-tab-containers', async (event, winId: TWindowId) => {
    scopeLog.info(`IPC tabs:get-tab-containers received for window ${winId}`);
    return await checkModalAndPagesSender(event, browser, winId, ['sidebar'], async (window) => {
      return browser.renderer.tabContainers(window);
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle('tabs:select', async (event, winId: TWindowId, tabId: TTabId) => {
    scopeLog.info(`IPC tabs:select received for window ${winId}, tab ${tabId}`);
    return await checkModalAndPagesSender(event, browser, winId, ['sidebar'], async (window) => {
      return window.selectTab(tabId);
    });
  });
}
