import { TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { getTab } from './helpers';

const scopeLog = log.scope('CloseTabCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'close-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Close Tab',
  description: 'Closes the currently active tab or a specified tab in the focused window.',
  visibility: ({ tab }) => !!tab,
  async handler({ browser, window, tab, params }) {
    const tabToClose = getTab(browser, tab!, params?.tabId);
    if (!tabToClose) {
      scopeLog.warn('No tab available to close.');
      return;
    }

    const success = await browser.closeTab(tabToClose.id);
    if (!success) {
      scopeLog.error(`Failed to close tab with id ${tabToClose.id}.`);
      return;
    }

    // Need to get the desktop to select the last desktop's last accessed tab
    const tabData = browser.getTab(tabToClose.id);
    if (!tabData) {
      scopeLog.error(`Tab with id ${tabToClose.id} not found after closure.`);
      return;
    }

    const desktop = tabData.desktop;

    const lastAccessed = window.getLastAccessedTab(desktop);
    if (!lastAccessed) {
      return;
    }

    window.selectTab(lastAccessed.tab.id);
  },
};
