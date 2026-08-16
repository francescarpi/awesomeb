import { TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { getTab } from './helpers';

const scopeLog = log.scope('SuspendTabCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'suspend-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.suspendTab.name',
  description: 'commands.suspendTab.description',
  visibility: ({ tab }) => !!tab,
  async handler({ browser, window, tab, params }) {
    const tabToSuspend = getTab(browser, tab, params?.tabId);
    if (!tabToSuspend) {
      scopeLog.warn('No tab available to suspend.');
      return;
    }

    // Need to get the desktop to select the last desktop's last accessed tab
    const tabData = browser.getTab(tabToSuspend.id);
    if (!tabData) {
      scopeLog.error(`Tab with id ${tabToSuspend.id} not found after suspension.`);
      return;
    }

    const success = await window.suspendTab(tabToSuspend.id);
    if (!success) {
      scopeLog.error(`Failed to suspend tab with id ${tabToSuspend.id}.`);
      return;
    }

    const desktop = tabData.desktop;

    const lastAccessed = window.getLastAccessedTab({ desktop });
    if (!lastAccessed) {
      return;
    }

    window.selectTab(lastAccessed.tab.id);
  },
};
