import { TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { getTab } from './helpers';
import { t } from '~/i18n';

const scopeLog = log.scope('CloseTabCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'close-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:closeTab.name'),
  description: () => t('commands:closeTab.description'),
  visibility: ({ tab }) => !!tab,
  async handler({ browser, window, tab, params }) {
    const tabToClose = getTab(browser, tab, params?.tabId);
    if (!tabToClose) {
      scopeLog.warn('No tab available to close.');
      return;
    }

    // Need to get the desktop to select the last desktop's last accessed tab
    const tabData = browser.getTab(tabToClose.id);
    if (!tabData) {
      scopeLog.error(`Tab with id ${tabToClose.id} not found after closure.`);
      return;
    }

    const success = await browser.closeTab(tabToClose.id);
    if (!success) {
      scopeLog.error(`Failed to close tab with id ${tabToClose.id}.`);
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
