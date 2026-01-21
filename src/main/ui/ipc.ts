import { Browser } from '@main/core';
import { ipcMain, WebContents } from 'electron';
import log from 'electron-log';
import { UINotification } from './notifications';
import { INotification, TWindowId } from '@shared/types';

const scopeLog = log.scope('IPCUI');

export function setupUIIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('ui:close-modal', async (event, winId: number) => {
    scopeLog.info(`IPC Received: layout-system:close-modal for window ID ${winId}`);

    const win = browser.getWindowById(winId);
    if (!win || !win.modal) {
      scopeLog.error(`No window found with ID ${winId}`);
      return;
    }

    if (win.modal.id !== event.sender.id) {
      scopeLog.error(
        `WebContents ID mismatch: modal WC ID ${win.modal.id} does not match sender WC ID ${event.sender.id}`,
      );
      return;
    }

    win.modal.close();
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('ui:next-notification', async (event, winId: number) => {
    scopeLog.info(`IPC Received: ui:next-notification for window ID ${winId}`);

    const win = browser.getWindowById(winId);
    if (!win) {
      scopeLog.error(`No window found with ID ${winId}`);
      return;
    }

    if (win.notifications.containerId !== event.sender.id) {
      scopeLog.error(
        `WebContents ID mismatch: notification container WC ID ${win.notifications.containerId} ` +
          `does not match sender WC ID ${event.sender.id}`,
      );
      return;
    }

    win.notifications.deleteFirstNotification();

    refreshNotifications(event.sender, winId, win.notifications.all);

    if (win.notifications.all.length === 0) {
      win.notifications.hideContainer();
    }
  });
}

//--------------------------------------------------------------------------------------
export function refreshNotifications(
  wc: WebContents,
  winId: TWindowId,
  notifications: UINotification[],
) {
  scopeLog.info(`Refreshing notifications for WebContents ID ${wc.id}`);

  const data: INotification[] = notifications.map((n) => ({
    id: n.id,
    message: n.message,
    severity: n.severity,
  }));

  wc.send('ui:refresh-notifications', winId, data);
}
