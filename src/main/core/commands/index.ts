import { ICommand } from './types';
import { Browser } from '@main/core';

export { setupCommandsIPC } from './ipc';

import * as windowMinimize from './window-minimize';
import * as windowMaximize from './window-maximize';
import * as windowClose from './window-close';

const COMMANDS = {
  [windowMinimize.TRIGGER]: windowMinimize.Command,
  [windowMaximize.TRIGGER]: windowMaximize.Command,
  [windowClose.TRIGGER]: windowClose.Command,
};

export type TCommandTrigger = keyof typeof COMMANDS;

export function getCommands(browser: Browser): ICommand<any>[] {
  const focusedWindow = browser.getFocusedWindow();

  return Object.values(COMMANDS)
    .filter((c) => c.visibility === undefined || c.visibility({ focusedWindow }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCommand(trigger: TCommandTrigger): ICommand<any> | null {
  return COMMANDS[trigger] || null;
}
