import { TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('SuspendTabCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'suspend-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Suspend Tab',
  description: 'Suspends the currently active tab in the focused window.',
  visibility: ({ tab }) => !!tab,
  async handler({ browser, window, tab, params }) {
    let tabToSuspend = tab;
    if (params?.tabId) {
      const targetTab = browser.getTab(params.tabId);
      if (!targetTab) {
        scopeLog.warn(`Tab with ID ${params.tabId} not found.`);
        return;
      }

      tabToSuspend = targetTab.tab;
    }

    if (!tabToSuspend) {
      scopeLog.warn('No tab available to suspend.');
      return;
    }

    const success = await window.suspendTab(tabToSuspend.id);
    if (success) {
      const lastAccessed = window.getLastAccessedTab();
      if (lastAccessed) {
        window.selectTab(lastAccessed.tab.id);
      }
    }
  },
};
