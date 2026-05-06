import { Browser, getCommand, TCommandTrigger, Window } from '@/core';
import { type IpcMainInvokeEvent } from 'electron';
import log from 'electron-log';
import { createHandler, windowChecker, modalChecker, viewChecker } from '@/utils';

const scopeLog = log.scope('IPCCommands');

export function setupCommandsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{
    trigger: TCommandTrigger;
    params: Record<string, unknown> | undefined;
    win: Window;
    event: IpcMainInvokeEvent;
  }>(
    'commands:perform',
    'handle',
    browser,
    [windowChecker, [modalChecker, viewChecker.bind(null, ['sidebar', 'urlbar', 'tab-switcher'])]],
    async ({ trigger, params, win, event }) => {
      const command = getCommand(trigger);
      if (!command) {
        scopeLog.error(`Command not found for trigger: ${trigger}`);
        return;
      }

      scopeLog.info(`Performing command for trigger: ${trigger}`);

      const comesFromPerformCommand = event.sender.getURL().includes('perform-command');

      if (comesFromPerformCommand && command.modal) {
        // Show command page...
        win.modal.open(command.modal.page, command.modal.props);
        return;
      }

      // Perform command action...
      const success = await browser.performCommand(win, trigger, params);
      if (!success) {
        scopeLog.error(`Failed to perform command for trigger: ${trigger}`);
        return;
      }

      if (win.modal && win.modal.isOpen) {
        setTimeout(() => {
          win.modal.close();
        }, 100);
      }
    },
  );
}
