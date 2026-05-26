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

      const promises: Promise<unknown>[] = [];

      // Close modal
      if (win.modal && win.modal.isOpen) {
        promises.push(
          new Promise((resolve) => {
            win.modal.close();
            resolve(null);
          }),
        );
      }

      // Perform command
      promises.push(browser.performCommand(win, trigger, params));

      Promise.all(promises).then((result) => {
        if (command.onPerformed) {
          command.onPerformed(result[1] as unknown as void);
        }
      });
    },
  );
}
