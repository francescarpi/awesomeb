import { Browser, getCommand, TCommandTrigger } from '@main/core';
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
        (window, modalManager) => {
          const command = getCommand(trigger);
          if (!command) {
            scopeLog.error(`Command not found for trigger: ${trigger}`);
            return;
          }

          const comesFromPerformCommand = event.sender.getURL().includes('perform-command');

          if (comesFromPerformCommand && command.page) {
            // Show command page...
            window.modal.open(command.page);
            return;
          }

          // Perform command action...
          const success = browser.performCommand(window, trigger, params);
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
