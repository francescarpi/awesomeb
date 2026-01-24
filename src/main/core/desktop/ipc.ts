import { Browser } from '@/core';
import { checkModalAndPagesSender } from '@/utils';
import { ipcMain } from 'electron';
import { TWindowId, TDesktopId } from '~/types';
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
}
