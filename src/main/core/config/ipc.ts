import { Browser, config } from '@/core';
import { checkInternalPage } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('ConfigIPC');

export function setupConfigIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('config:get', async (event, winId: TWindowId) => {
    scopeLog.info(`Get config for window ID ${winId}`);
    return await checkInternalPage(
      event,
      browser,
      'settings',
      (_window, _desktop, _tabContainer, _tab) => {
        return config.config;
      },
    );
  });
}
