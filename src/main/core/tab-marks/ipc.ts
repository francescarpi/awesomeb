import { ipcMain } from 'electron';
import log from 'electron-log';
import { Browser, tabMarks } from '@/core';
import { TWindowId } from '~/types';
import { checkModalAndPagesSender } from '@/utils';
import { TMarksAction } from './types';

const scopeLog = log.scope('TabMarksIPC');

export function setupTabMarksIpc(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('tabmarks:get', async (event, winId: TWindowId) => {
    scopeLog.info('get tab marks', winId);
    return await checkModalAndPagesSender(event, browser, winId, ['tab-marks'], async (_window) => {
      return tabMarks.all;
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('tabmarks:close', async (event, winId: TWindowId) => {
    scopeLog.info(`IPC Received: layout-system:close-tab-marks for window ID ${winId}`);
    return await checkModalAndPagesSender(event, browser, winId, ['tab-marks'], async (window) => {
      window.hideTabMarks();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle('tabmarks:perform', async (event, winId: TWindowId, action: TMarksAction) => {
    scopeLog.info(
      `IPC Received: layout-system:perform-tab-marks for window ID ${winId} with action`,
      action,
    );
    return await checkModalAndPagesSender(event, browser, winId, ['tab-marks'], async (_window) => {
      console.log(action);
    });
  });
}
