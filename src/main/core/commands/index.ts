import { ICommand } from './types';
import { Browser } from '@/core';

export { setupCommandsIPC } from './ipc';

import * as windowMinimize from './window-minimize';
import * as windowMaximize from './window-maximize';
import * as windowClose from './window-close';
import * as windowToggleSidebar from './window-toggle-sidebar';
import * as desktopNext from './desktop-next';
import * as desktopPrev from './desktop-prev';
import * as desktopSelect from './desktop-select';
import * as windowToggleMaximizeArea from './window-toggle-maximize-area';
import * as desktopRename from './desktop-rename';
import * as desktopTheme from './desktop-theme';

const COMMANDS = {
  [windowMinimize.TRIGGER]: windowMinimize.Command,
  [windowMaximize.TRIGGER]: windowMaximize.Command,
  [windowClose.TRIGGER]: windowClose.Command,
  [windowToggleSidebar.TRIGGER]: windowToggleSidebar.Command,
  [desktopNext.TRIGGER]: desktopNext.Command,
  [desktopPrev.TRIGGER]: desktopPrev.Command,
  [desktopSelect.TRIGGER]: desktopSelect.Command,
  [windowToggleMaximizeArea.TRIGGER]: windowToggleMaximizeArea.Command,
  [desktopRename.TRIGGER]: desktopRename.Command,
  [desktopTheme.TRIGGER]: desktopTheme.Command,
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
