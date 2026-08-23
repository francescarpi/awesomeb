import { TPartitionId, TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { getTab } from './helpers';
import { t } from '~/i18n';

const scopeLog = log.scope('ChangeTabProfileCommand');

export interface ICommandParams {
  tabId?: TTabId;
  partitionId: TPartitionId;
}

export const TRIGGER = 'change-tab-profile';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:changeTabProfile.name'),
  description: () => t('commands:changeTabProfile.description'),
  visibility: ({ tab }) => !!tab,
  modal: {
    page: 'change-tab-profile',
  },
  async handler({ browser, tab, params }) {
    const affectedTab = getTab(browser, tab, params?.tabId);
    if (!affectedTab) {
      scopeLog.warn('No tab available.');
      return;
    }

    const url = affectedTab.url;
    if (!url) {
      scopeLog.warn('Tab has no URL.');
      return;
    }

    browser.closeTab(affectedTab.id);
    browser.openURL(url, {
      partitionId: params?.partitionId,
      selectTab: true,
    });
  },
};
