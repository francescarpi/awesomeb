import { Browser } from '@/core';
import { ipcMain } from 'electron';
import { TExtensionId, TWindowId } from '~/types';
import log from 'electron-log';
import { checkInternalPage, checkModalAndPagesSender } from '@/utils';

const scopeLog = log.scope('ExtensionsIPC');

export function setupExtensionsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('extensions:get', async (event, winId?: TWindowId) => {
    scopeLog.info('Getting extensions data', { winId });
    if (winId) {
      return await checkModalAndPagesSender(event, browser, winId, [], async (_window) => {
        return browser.renderer.extensions();
      });
    }
    return await checkInternalPage(event, browser, 'extensions', async (_window) => {
      return browser.renderer.extensions();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle('extensions:refresh', async (event) => {
    scopeLog.info('Refreshing extensions data');
    return await checkInternalPage(event, browser, 'extensions', async (_window) => {
      browser.extensions.refresh();
      return browser.renderer.extensions();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle('extensions:toggle', async (event, id: TExtensionId) => {
    scopeLog.info('Toggle extension', id);
    return await checkInternalPage(event, browser, 'extensions', async (_window) => {
      browser.extensions.toggle(id);
      return browser.renderer.extensions();
    });
  });
}
