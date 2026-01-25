import { Browser } from '@/core';
import { checkModalAndPagesSender } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId } from '~/types';
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
}
