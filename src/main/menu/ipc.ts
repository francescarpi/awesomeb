import { Browser } from '@/core';
import { checkModalAndPagesSender } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId, TMenuType, TDesktopId } from '~/types';
import log from 'electron-log';
import { desktopMenu } from './desktop';
import { mainMenu } from './main';

const scopeLog = log.scope('MenuIPC');

export function setupMenuIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'menu:context-menu',
    async (event, winId: TWindowId, type: TMenuType, params?: Record<string, unknown>) => {
      scopeLog.debug(`IPC menu:context-menu received for window ${winId} with type ${type}`);
      return await checkModalAndPagesSender(
        event,
        browser,
        winId,
        ['sidebar', 'urlbar'],
        async (window) => {
          switch (type) {
            case 'desktop': {
              if (!params || !params['desktopId']) {
                scopeLog.warn(`Missing desktopId in params for desktop menu on window ${winId}`);
                return;
              }
              const desktop = window.selectDesktop(params['desktopId'] as TDesktopId);
              if (!desktop) {
                scopeLog.warn(
                  `Desktop with ID ${params['desktopId']} not found for window ${winId}`,
                );
                return;
              }

              const menu = desktopMenu(browser, window, desktop);
              menu.popup({ window: window.bw });
              break;
            }
            case 'main': {
              const menu = await mainMenu(browser, true);
              menu.popup({ window: window.bw });
              break;
            }
          }
        },
      );
    },
  );
}
