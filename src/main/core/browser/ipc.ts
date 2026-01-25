import { Browser } from '@/core';
import { checkModalAndPagesSender } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId, TEntityType } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('BrowserIPC');

export function setupBrowserIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('entities:fetch', async (event, winId: TWindowId, entity: TEntityType) => {
    scopeLog.info(`IPC Received: entities:fetch for window ID ${winId} and entity ${entity}`);
    return await checkModalAndPagesSender(event, browser, winId, ['sidebar'], (window) => {
      switch (entity) {
        case 'commands':
          return browser.renderer.commands();
        case 'desktops':
          return browser.renderer.desktops(window);
        case 'themes':
          return browser.renderer.themes(window);
      }
    });
  });
}
