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
import * as tabNew from './tab-new';
import * as tabNext from './tab-next';
import * as tabPrev from './tab-prev';
import * as tabSuspend from './tab-suspend';
import * as tabContainerSelectByIndex from './tabcontainer-select-by-index';
import * as tabSelect from './tab-select';
import * as tabClose from './tab-close';

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
  [tabNew.TRIGGER]: tabNew.Command,
  [tabNext.TRIGGER]: tabNext.Command,
  [tabPrev.TRIGGER]: tabPrev.Command,
  [tabSuspend.TRIGGER]: tabSuspend.Command,
  [tabContainerSelectByIndex.TRIGGER]: tabContainerSelectByIndex.Command,
  [tabSelect.TRIGGER]: tabSelect.Command,
  [tabClose.TRIGGER]: tabClose.Command,
};

export type TCommandTrigger = keyof typeof COMMANDS;

export function getCommands(browser: Browser): ICommand<any>[] {
  const window = browser.activeWindow;
  const desktop = window?.selectedDesktop || null;
  const tabContainer = desktop?.selectedTabContainer || null;
  const tab = tabContainer?.selectedTab || null;

  return Object.values(COMMANDS)
    .filter(
      (c) => c.visibility === undefined || c.visibility({ window, desktop, tabContainer, tab }),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCommand(trigger: TCommandTrigger): ICommand<any> | null {
  return COMMANDS[trigger] || null;
}
