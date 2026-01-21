import { Browser, Window } from '@main/core';
import { UIView } from '@main/ui';
import { TWindowId } from '@shared/types';
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import log from 'electron-log';

const scopeLog = log.scope('IPCWindow');

async function checkSender(
  event: IpcMainInvokeEvent,
  browser: Browser,
  winId: TWindowId,
  page: string,
  callback: (window: Window, view: UIView) => void,
) {
  const win = browser.getWindowById(winId);
  if (!win) {
    scopeLog.warn(`Window with id ${winId} not found`);
    return;
  }

  const view = win.getView(page);
  if (!view || view.webContents.id !== event.sender.id) {
    scopeLog.warn(
      `Sender webContents id ${event.sender.id} does not match window id ${winId} and page ${page}`,
    );
    return;
  }

  callback(win, view);
}

export function setupWindowIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('window:close', async (event, winId: number) => {
    scopeLog.info(`IPC window:close ${winId}`);
    return await checkSender(event, browser, winId, 'sidebar', (window, _view) => {
      // TODO Use a command instead work with webcontents directly
      window.close();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('window:minimize', async (event, winId: number) => {
    scopeLog.info(`IPC window:minimize ${winId}`);
    return await checkSender(event, browser, winId, 'sidebar', (window, _view) => {
      // TODO Use a command instead work with webcontents directly
      window.minimize();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('window:maximize', async (event, winId: number) => {
    scopeLog.info(`IPC window:maximize ${winId}`);
    return await checkSender(event, browser, winId, 'sidebar', (window, _view) => {
      // TODO Use a command instead work with webcontents directly
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    });
  });
}
