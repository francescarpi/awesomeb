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
import * as tabReload from './tab-reload';
import * as tabHistoryBack from './tab-history-back';
import * as tabHistoryForward from './tab-history-forward';
import * as tabRename from './tab-rename';
import * as urlCopy from './url-copy';
import * as urlEdit from './url-edit';
import * as findInPage from './find-in-page';
import * as tabContainerAddDivider from './tabcontainer-add-divider';
import * as tabContainerRemoveDivider from './tabcontainer-remove-divider';
import * as desktopRemoveAllDividers from './desktop-remove-all-dividers';
import * as tabSelectRequireAttention from './tab-select-require-attention';
import * as desktopSuspend from './desktop-suspend';
import * as tabStop from './tab-stop';
import * as urlHistoryClear from './url-history-clear';
import * as tabMove from './tab-move';
import * as tabDevtools from './tab-devtools';
import * as tabContainerMoveUp from './tabcontainer-move-up';
import * as tabContainerMoveDown from './tabcontainer-move-down';
import * as devtoolsSidebar from './devtools-sidebar';
import * as devtoolsUrlbar from './devtools-urlbar';
import * as tabCloseBelow from './tab-close-below';
import * as tabChangeProfile from './tab-change-profile';
import * as tabCertificateInfo from './tab-certificate-info';
import * as tabDuplicate from './tab-duplicate';
import * as tabpreviewClose from './tabpreview-close';
import * as tabpreviewAccept from './tabpreview-accept';
import * as tabToggleMute from './tab-toggle-mute';

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
  [tabReload.TRIGGER]: tabReload.Command,
  [tabHistoryBack.TRIGGER]: tabHistoryBack.Command,
  [tabHistoryForward.TRIGGER]: tabHistoryForward.Command,
  [tabRename.TRIGGER]: tabRename.Command,
  [urlCopy.TRIGGER]: urlCopy.Command,
  [urlEdit.TRIGGER]: urlEdit.Command,
  [findInPage.TRIGGER]: findInPage.Command,
  [tabContainerAddDivider.TRIGGER]: tabContainerAddDivider.Command,
  [tabContainerRemoveDivider.TRIGGER]: tabContainerRemoveDivider.Command,
  [desktopRemoveAllDividers.TRIGGER]: desktopRemoveAllDividers.Command,
  [tabSelectRequireAttention.TRIGGER]: tabSelectRequireAttention.Command,
  [desktopSuspend.TRIGGER]: desktopSuspend.Command,
  [tabStop.TRIGGER]: tabStop.Command,
  [urlHistoryClear.TRIGGER]: urlHistoryClear.Command,
  [tabMove.TRIGGER]: tabMove.Command,
  [tabDevtools.TRIGGER]: tabDevtools.Command,
  [tabContainerMoveUp.TRIGGER]: tabContainerMoveUp.Command,
  [tabContainerMoveDown.TRIGGER]: tabContainerMoveDown.Command,
  [devtoolsSidebar.TRIGGER]: devtoolsSidebar.Command,
  [devtoolsUrlbar.TRIGGER]: devtoolsUrlbar.Command,
  [tabCloseBelow.TRIGGER]: tabCloseBelow.Command,
  [tabChangeProfile.TRIGGER]: tabChangeProfile.Command,
  [tabCertificateInfo.TRIGGER]: tabCertificateInfo.Command,
  [tabDuplicate.TRIGGER]: tabDuplicate.Command,
  [tabpreviewClose.TRIGGER]: tabpreviewClose.Command,
  [tabpreviewAccept.TRIGGER]: tabpreviewAccept.Command,
  [tabToggleMute.TRIGGER]: tabToggleMute.Command,
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
