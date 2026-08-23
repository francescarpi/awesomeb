import { ICommand } from './types';
import { TTabId } from '~/types';
import log from 'electron-log';
import { getTab } from './helpers';
import { t } from '~/i18n';

const scopeLog = log.scope('ToggleOpenTabsAsChildCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'toggle-open-tabs-as-child';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:toggleOpenTabsAsChild.name'),
  description: () => t('commands:toggleOpenTabsAsChild.description'),
  visibility: ({ tab, tabContainer }) => !!tab && !!tabContainer && tabContainer.parent === null,
  async handler({ tab, browser, params }) {
    const targetTab = getTab(browser, tab, params?.tabId);
    if (!targetTab) {
      scopeLog.warn('No tab available');
      return;
    }

    // Only top-level tabs can open children. Child tabs must not toggle
    // the flag on, otherwise opening a tab from a child would create a
    // grandchild (which contradicts the parent/child hierarchy rules).
    const targetTabResult = params?.tabId
      ? browser.getTab(params.tabId)
      : browser.getTab(targetTab.id);

    if (targetTabResult && targetTabResult.tabContainer.parent !== null) {
      return;
    }

    targetTab.setOpenTabsAsChild(!targetTab.openTabsAsChild);
  },
};
