import { Browser } from '@/core';
import { checkModalAndPagesSender, checkWindowSender } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId, TDesktopId, ITheme } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('DesktopIPC');

export function setupDesktopIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('desktops:select', async (event, winId: TWindowId, desktopId: TDesktopId) => {
    scopeLog.info(
      `IPC Received: desktops:select for window ID ${winId} and desktop ID ${desktopId}`,
    );
    return await checkModalAndPagesSender(event, browser, winId, ['sidebar'], (window) => {
      window.goDesktop(desktopId);
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle('desktops:get-theme', async (event, winId: TWindowId) => {
    scopeLog.info(`IPC Received: desktops:get-theme for window ID ${winId}`);
    return await checkWindowSender(event, browser, winId, (window) => {
      const theme = window.selectedDesktop.theme;
      const result: ITheme = {
        primary: theme.primary,
        secondary: theme.secondary,
        degrees: theme.degrees,
      };
      return result;
    });
  });
}
