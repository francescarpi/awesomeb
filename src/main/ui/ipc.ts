import { Browser } from '@/core';
import { ipcMain } from 'electron';
import log from 'electron-log';
import { IContextualModalParams, TPage, TWindowId } from '~/types';
import { checkModalAndPagesSender, checkModalSender, checkContextualModal } from '@/utils';

const scopeLog = log.scope('IPCUI');

export function setupUIIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('modal:close', async (event, winId: TWindowId) => {
    scopeLog.info(`IPC Received: layout-system:close-modal for window ID ${winId}`);
    return await checkModalSender(event, browser, winId, (_win, modalManager) => {
      modalManager.close();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('modal:open', async (event, winId: TWindowId, page: TPage) => {
    scopeLog.info(
      `IPC Received: layout-system:open-modal for window ID ${winId} with page ${page}`,
    );
    return await checkModalAndPagesSender(
      event,
      browser,
      winId,
      ['urlbar', 'sidebar'],
      async (window) => {
        window.modal.open(page);
      },
    );
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('tabswitcher:close', async (event, winId: TWindowId) => {
    scopeLog.info(`IPC Received: layout-system:close-tab-switcher for window ID ${winId}`);
    return await checkModalAndPagesSender(
      event,
      browser,
      winId,
      ['tab-switcher'],
      async (window) => {
        window.hideTabSwitcher();
      },
    );
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'modal:open-contextual',
    async (event, winId: TWindowId, page: TPage, params: IContextualModalParams) => {
      scopeLog.info(`Open contextual modal "${page}" for window ${winId}.`);
      return await checkModalAndPagesSender(event, browser, winId, ['sidebar'], async (window) => {
        window.modal.openContextual(page, params);
        window.renderViews();
      });
    },
  );

  //--------------------------------------------------------------------------------------
  ipcMain.on('modal:close-contextual', async (event, winId: TWindowId) => {
    scopeLog.info(`Close contextual modal for window ${winId}.`);
    return await checkContextualModal(event, browser, winId, async (window) => {
      window.modal.closeContextual();
      window.renderViews();
    });
  });
}
