import { TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';

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
    let tabToClose = tab;
    if (params.tabId) {
      const targetTab = browser.getTab(params.tabId);
      if (!targetTab) {
        scopeLog.warn(`Tab with ID ${params.tabId} not found.`);
        return;
      }

      tabToClose = targetTab.tab;
    }

    if (!tabToClose) {
      scopeLog.warn('No tab available to close.');
      return;
    }

    const success = await window.closeTab(tabToClose.id);
    if (success) {
      const lastAccessed = window.getLastAccessedTab();
      if (lastAccessed) {
        window.selectTab(lastAccessed.tab.id);
      }
    }
  },
};
