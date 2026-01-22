import { Browser } from '@main/core';
import { ipcMain, WebContents } from 'electron';
import log from 'electron-log';
import { UINotification } from './notifications';
import {
  INotification,
  TWindowId,
  TListWithSearchEntity,
  IListWithSearchEntity,
} from '@shared/types';

const scopeLog = log.scope('IPCUI');

export function setupUIIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('modal:close', async (event, winId: TWindowId) => {
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
    win.focus();
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('notifications:next', async (event, winId: TWindowId) => {
    scopeLog.info(`IPC Received: notifications:next for window ID ${winId}`);

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

  //--------------------------------------------------------------------------------------
  ipcMain.handle(
    'list-with-search:get-entities',
    async (event, winId: TWindowId, entity: TListWithSearchEntity) => {
      scopeLog.info(
        `IPC Received: list-with-search:get-entities for window ID ${winId} and entity ${entity}`,
      );

      // TODO validate winId!!
      // TODO switch command

      const resp: IListWithSearchEntity[] = [
        {
          id: 'close-window',
          label: 'Close Window',
          extra: 'Close the current window',
        },
        {
          id: 'minimize-window',
          label: 'Minimize Window',
          extra: 'Minimize the current window',
        },
        {
          id: 'maximize-window',
          label: 'Maximize Window',
          extra: 'Maximize the current window',
        },
        {
          id: 'item-4',
          label: 'Item 4',
          extra: 'Extra info for item 4',
        },
        {
          id: 'item-5',
          label: 'Item 5',
          extra: 'Extra info for item 5',
        },
        {
          id: 'item-6',
          label: 'Item 6',
          extra: 'Extra info for item 6',
        },
      ];
      return resp;
    },
  );
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

  wc.send('notifications:on-refresh', winId, data);
}
