import { Browser } from '@/core';
import { checkModalAndPagesSender } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId, TMenuType, TDesktopId } from '~/types';
import log from 'electron-log';
import { desktopMenu } from './desktop';

const scopeLog = log.scope('MenuIPC');

export function setupMenuIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'menu:context-menu',
    async (
      event,
      winId: TWindowId,
      type: TMenuType,
      x: number,
      y: number,
      params: Record<string, unknown>,
    ) => {
      scopeLog.debug(`IPC menu:context-menu received for window ${winId} with type ${type}`);
      return await checkModalAndPagesSender(event, browser, winId, ['sidebar'], (window) => {
        switch (type) {
          case 'desktop': {
            const desktop = window.selectDesktop(params['desktopId'] as TDesktopId);
            if (!desktop) {
              scopeLog.warn(`Desktop with ID ${params['desktopId']} not found for window ${winId}`);
              return;
            }

            const menu = desktopMenu(browser, window, desktop);
            menu.popup({ window: window.bw, x, y });
          }
        }
      });
    },
  );
}
