import { ICommand } from './types';
import { Browser } from '@/core';

export { setupCommandsIPC } from './ipc';

import * as windowMinimize from './window-minimize';
import * as windowMaximize from './window-maximize';
import * as windowClose from './window-close';
import * as windowToggleSidebar from './window-toggle-sidebar';
import * as desktopAdd from './desktop-add';
import * as desktopRemove from './desktop-remove';
import * as desktopMoveLeft from './desktop-move-left';
import * as desktopMoveRight from './desktop-move-right';
import * as desktopNext from './desktop-next';
import * as desktopPrev from './desktop-prev';
import * as desktopSelect from './desktop-select';
import * as windowToggleMaximizeArea from './window-toggle-maximize-area';
import * as desktopRename from './desktop-rename';
import * as desktopTheme from './desktop-theme';
import * as tabNew from './tab-new';
import * as tabNewFromClipboard from './tab-new-from-clipboard';
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
import * as tabOpenClosed from './tab-open-closed';
import * as tabPrint from './tab-print';
import * as extensionsManage from './extensions-manage';
import * as sessionSave from './session-save';
import * as layoutSelect from './layout-select';
import * as layoutSwapTabs from './layout-swap-tabs';
import * as layoutUnsplitt from './layout-unsplit';
import * as layoutSize from './layout-size';
import * as tabpreviewSplit from './tabpreview-split';
import * as devtoolsWindow from './devtools-window';
import * as devtoolsTabswitcher from './devtools-tabswitcher';
import * as tabZoomIn from './tab-zoom-in';
import * as tabZoomOut from './tab-zoom-out';
import * as tabZoomReset from './tab-zoom-reset';
import * as visitHistoryPage from './visit-history-page';
import * as debugPage from './debug-page';
import * as windowNew from './window-new';
import * as tabClearClosed from './tab-clear-closed';
import * as tabPreviousVisited from './tab-previous-visited';
import * as tabToggleOpenTabsAschild from './tab-toggle-open-tabs-as-child';
import * as tabCloseChildren from './tab-close-children';
import * as tabContainerToggleCollapseChildren from './tabcontainer-toggle-collapse-children';
import * as appCopyVersion from './app-copy-version';
import * as bookmakrsManage from './bookmarks-manage';
import * as tabViewSource from './tab-view-source';

const COMMANDS = {
  [windowMinimize.TRIGGER]: windowMinimize.Command,
  [windowMaximize.TRIGGER]: windowMaximize.Command,
  [windowClose.TRIGGER]: windowClose.Command,
  [windowToggleSidebar.TRIGGER]: windowToggleSidebar.Command,
  [desktopAdd.TRIGGER]: desktopAdd.Command,
  [desktopRemove.TRIGGER]: desktopRemove.Command,
  [desktopMoveLeft.TRIGGER]: desktopMoveLeft.Command,
  [desktopMoveRight.TRIGGER]: desktopMoveRight.Command,
  [desktopNext.TRIGGER]: desktopNext.Command,
  [desktopPrev.TRIGGER]: desktopPrev.Command,
  [desktopSelect.TRIGGER]: desktopSelect.Command,
  [windowToggleMaximizeArea.TRIGGER]: windowToggleMaximizeArea.Command,
  [desktopRename.TRIGGER]: desktopRename.Command,
  [desktopTheme.TRIGGER]: desktopTheme.Command,
  [tabNew.TRIGGER]: tabNew.Command,
  [tabNewFromClipboard.TRIGGER]: tabNewFromClipboard.Command,
  [tabNext.TRIGGER]: tabNext.Command,
  [tabPrev.TRIGGER]: tabPrev.Command,
  [tabSuspend.TRIGGER]: tabSuspend.Command,
  [tabContainerSelectByIndex.TRIGGER]: tabContainerSelectByIndex.Command,
  [tabSelect.TRIGGER]: tabSelect.Command,
  [tabClose.TRIGGER]: tabClose.Command,
  [tabCloseChildren.TRIGGER]: tabCloseChildren.Command,
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
  [tabOpenClosed.TRIGGER]: tabOpenClosed.Command,
  [tabPrint.TRIGGER]: tabPrint.Command,
  [extensionsManage.TRIGGER]: extensionsManage.Command,
  [sessionSave.TRIGGER]: sessionSave.Command,
  [layoutSelect.TRIGGER]: layoutSelect.Command,
  [layoutSwapTabs.TRIGGER]: layoutSwapTabs.Command,
  [layoutUnsplitt.TRIGGER]: layoutUnsplitt.Command,
  [layoutSize.TRIGGER]: layoutSize.Command,
  [tabpreviewSplit.TRIGGER]: tabpreviewSplit.Command,
  [devtoolsWindow.TRIGGER]: devtoolsWindow.Command,
  [devtoolsTabswitcher.TRIGGER]: devtoolsTabswitcher.Command,
  [tabZoomIn.TRIGGER]: tabZoomIn.Command,
  [tabZoomOut.TRIGGER]: tabZoomOut.Command,
  [tabZoomReset.TRIGGER]: tabZoomReset.Command,
  [visitHistoryPage.TRIGGER]: visitHistoryPage.Command,
  [debugPage.TRIGGER]: debugPage.Command,
  [windowNew.TRIGGER]: windowNew.Command,
  [tabClearClosed.TRIGGER]: tabClearClosed.Command,
  [tabPreviousVisited.TRIGGER]: tabPreviousVisited.Command,
  [tabToggleOpenTabsAschild.TRIGGER]: tabToggleOpenTabsAschild.Command,
  [tabContainerToggleCollapseChildren.TRIGGER]: tabContainerToggleCollapseChildren.Command,
  [appCopyVersion.TRIGGER]: appCopyVersion.Command,
  [bookmakrsManage.TRIGGER]: bookmakrsManage.Command,
  [tabViewSource.TRIGGER]: tabViewSource.Command,
};

export type TCommandTrigger = keyof typeof COMMANDS;

export function getCommands(browser: Browser): ICommand<any, any>[] {
  const window = browser.activeWindow;
  const desktop = window?.selectedDesktop || null;
  const tabContainer = desktop?.selectedTabContainer || null;
  const tab = tabContainer?.selectedTab || null;

  return Object.values(COMMANDS)
    .filter(
      (c) =>
        c.visibility === undefined || c.visibility({ browser, window, desktop, tabContainer, tab }),
    )
    .sort((a, b) => a.name().localeCompare(b.name()));
}

export function getCommand(trigger: TCommandTrigger): ICommand<any, any> | null {
  return COMMANDS[trigger] || null;
}
