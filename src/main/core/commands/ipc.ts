import { Browser, getCommand, TCommandTrigger } from '@/core';
import { ipcMain } from 'electron';
import { TWindowId } from '~/types';
import log from 'electron-log';
import { checkModalAndPagesSender } from '@/utils';

const scopeLog = log.scope('IPCCommands');

export function setupCommandsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle(
    'commands:perform',
    async (event, winId: TWindowId, trigger: TCommandTrigger, params?: Record<string, unknown>) => {
      scopeLog.info(`IPC Received: commands:perform for window ID ${winId}`);
      return await checkModalAndPagesSender(
        event,
        browser,
        winId,
        ['sidebar', 'urlbar', 'tab-switcher'],
        async (window, modalManager) => {
          const command = getCommand(trigger);
          if (!command) {
            scopeLog.error(`Command not found for trigger: ${trigger}`);
            return;
          }

          scopeLog.info(`Performing command for trigger: ${trigger}`);

          const comesFromPerformCommand = event.sender.getURL().includes('perform-command');

          if (comesFromPerformCommand && command.modal) {
            // Show command page...
            window.modal.open(command.modal.page, command.modal.props);
            return;
          }

          // Perform command action...
          const success = await browser.performCommand(window, trigger, params);
          if (!success) {
            scopeLog.error(`Failed to perform command for trigger: ${trigger}`);
            return;
          }

          if (modalManager && modalManager.isOpen) {
            modalManager.close();
          }
        },
      );
    },
  );
}
