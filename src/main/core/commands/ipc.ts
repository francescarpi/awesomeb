import { Browser, TCommandTrigger } from '@main/core';
import { ipcMain } from 'electron';
import { TWindowId } from '@shared/types';
import log from 'electron-log';
import { checkModalAndPagesSender } from '@main/utils';

const scopeLog = log.scope('IPCCommands');

export function setupCommandsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'commands:perform',
    async (event, winId: TWindowId, trigger: TCommandTrigger, params?: Record<string, unknown>) => {
      scopeLog.info(`IPC Received: layout-system:close-modal for window ID ${winId}`);
      return await checkModalAndPagesSender(
        event,
        browser,
        winId,
        ['sidebar'],
        (win, modalManager) => {
          const success = browser.performCommand(win, trigger, params);
          if (!success) {
            scopeLog.error(`Failed to perform command for trigger: ${trigger}`);
            return;
          }

          if (modalManager) {
            modalManager.close();
          }
        },
      );
    },
  );
}
