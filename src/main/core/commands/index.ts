import { ICommand } from './types';
import { Browser } from '@main/core';

import * as windowMinimize from './window-minimize';
import * as windowMaximize from './window-maximize';
import * as windowClose from './window-close';

export const Commands = {
  [windowMinimize.TRIGGER]: windowMinimize.Command,
  [windowMaximize.TRIGGER]: windowMaximize.Command,
  [windowClose.TRIGGER]: windowClose.Command,
};

export function getAllCommands(browser: Browser): ICommand<any>[] {
  const focusedWindow = browser.getFocusedWindow();

  return Object.values(Commands)
    .filter((c) => c.visibility === undefined || c.visibility({ focusedWindow }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
