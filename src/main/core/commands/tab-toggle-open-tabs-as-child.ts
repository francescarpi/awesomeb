import { ICommand } from './types';
import { TTabId } from '~/types';
import log from 'electron-log';
import { getTab } from './helpers';

const scopeLog = log.scope('ToggleOpenTabsAsChildCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'toggle-open-tabs-as-child';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Toggle Open Tabs As Child',
  description: 'Toggles whether new tabs opened from this tab become its children.',
  visibility: ({ tab }) => !!tab,
  async handler({ tab, browser, params }) {
    const targetTab = getTab(browser, tab, params?.tabId);
    if (!targetTab) {
      scopeLog.warn('No tab available');
      return;
    }

    targetTab.setOpenTabsAsChild(!targetTab.openTabsAsChild);
  },
};
