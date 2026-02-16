import { checkModalSender } from '@/utils';
import { ipcMain } from 'electron';
import log from 'electron-log';
import { Browser, openURLHistory } from '@/core';
import { TWindowId } from '~/types';

const scopeLog = log.scope('OpenURLHistoryIpc');

export function setupOpenURLHistoryIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('open-url-history:find', async (event, winId: TWindowId, query: string) => {
    scopeLog.info(`IPC: open-url-history:find - winId: ${winId}, query: ${query}`);
    return await checkModalSender(event, browser, winId, async (_window, _modalManager) => {
      return openURLHistory.find(query);
    });
  });
}
