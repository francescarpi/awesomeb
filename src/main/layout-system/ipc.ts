import { Browser } from '@main/core';
import { ipcMain } from 'electron';
import log from 'electron-log';

const scopeLog = log.scope('IPCLayoutSystem');

export function setupLayoutSystemIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('layout-system:close-modal', (event, winId: number) => {
    scopeLog.info(`IPC Received: layout-system:close-modal for window ID ${winId}`);

    const win = browser.getWindowById(winId);
    if (!win || !win.modal) {
      scopeLog.error(`No window found with ID ${winId}`);
      return;
    }

    if (win.modal.wcId !== event.sender.id) {
      scopeLog.error(
        `WebContents ID mismatch: modal WC ID ${win.modal.wcId} does not match sender WC ID ${event.sender.id}`,
      );
      return;
    }

    win.closeModal();
  });
}
