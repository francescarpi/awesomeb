import { ipcMain } from 'electron';
import log from 'electron-log';
import { Browser, tabMarks } from '@/core';
import { TWindowId, TMarksAction } from '~/types';
import { checkModalAndPagesSender } from '@/utils';

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
    scopeLog.info(`IPC Received: tabmarks:perform for window ID ${winId} with action`, action);
    return await checkModalAndPagesSender(event, browser, winId, ['tab-marks'], async (window) => {
      const selectedTabData = window.selectedTab;

      switch (action.id) {
        case 'deleteAll':
          tabMarks.deleteAll();
          break;
        case 'deleteOne': {
          if (!selectedTabData) {
            break;
          }

          tabMarks.deleteByTabId(selectedTabData.tab.id);
          break;
        }
        case 'add': {
          if (!selectedTabData) {
            break;
          }

          tabMarks.add(action.trigger, selectedTabData.tab.id, selectedTabData.tab.title);
          break;
        }
        case 'select': {
          const mark = tabMarks.get(action.trigger);
          if (!mark) {
            break;
          }

          const tabData = window.getTab(mark.tabId);
          if (!tabData) {
            scopeLog.warn(`Tab with ID ${mark.tabId} not found for mark ${mark.trigger}`);
            tabMarks.deleteByTabId(mark.tabId);
            break;
          }

          window.hideTabMarks();
          window.selectTab(mark.tabId);
        }
      }

      return tabMarks.all;
    });
  });
}
