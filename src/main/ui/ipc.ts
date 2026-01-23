import { Browser, getCommands } from '@main/core';
import { ipcMain, WebContents } from 'electron';
import log from 'electron-log';
import { UINotification } from './notifications';
import {
  INotification,
  TWindowId,
  TListWithSearchEntity,
  IListWithSearchEntity,
} from '@shared/types';
import { checkModalSender } from '@main/utils';

const scopeLog = log.scope('IPCUI');

export function setupUIIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on('modal:close', async (event, winId: TWindowId) => {
    scopeLog.info(`IPC Received: layout-system:close-modal for window ID ${winId}`);
    return await checkModalSender(event, browser, winId, (win, modalManager) => {
      modalManager.close();
    });
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
      return await checkModalSender(event, browser, winId, (window) => {
        let result: IListWithSearchEntity[] = [];

        switch (entity) {
          case 'commands': {
            result = getCommands(browser).map((cmd) => ({
              id: cmd.trigger,
              label: cmd.name,
              extra: cmd.description,
            }));
            break;
          }
          case 'desktops': {
            result = window.desktops.map((desk) => ({
              id: desk.id.toString(),
              label: desk.label,
              extra: '',
            }));
            break;
          }
        }
        return result;
      });
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
