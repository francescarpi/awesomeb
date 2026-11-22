import { ICommand } from './types';
import { TTabId, TTabTagId } from '~/types';
import log from 'electron-log';
import { getTab } from './helpers';
import { t } from '~/i18n';

const scopeLog = log.scope('ToggleTabTagCommand');

export interface ICommandParams {
  tabId?: TTabId;
  tagId?: TTabTagId;
}

export const TRIGGER = 'toggle-tab-tag';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:toggleTabTag.name'),
  description: () => t('commands:toggleTabTag.description'),
  visible: () => false,
  async handler({ tab, browser, params }) {
    const targetTab = getTab(browser, tab, params?.tabId);
    if (!targetTab) {
      scopeLog.warn('No tab available');
      return;
    }

    const tagId = params?.tagId;
    if (!tagId) {
      scopeLog.warn('No tag available');
      return;
    }

    const assigned = browser.tabTags.get(targetTab.id);

    if (assigned.includes(tagId)) {
      browser.tabTags.unassign(targetTab.id, tagId);
    } else {
      browser.tabTags.assign(targetTab.id, tagId);
    }
  },
};
