import { Browser } from '@/core';
import { checkWindowSender } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('WindowIPC');

export function setupWindowIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('window:ready-to-show', async (event, winId: TWindowId) => {
    scopeLog.info(`Received 'window:ready-to-show' for window ID ${winId}`);
    return await checkWindowSender(event, browser, winId, (window) => {
      window.show();
      window.focus();
    });
  });
}
