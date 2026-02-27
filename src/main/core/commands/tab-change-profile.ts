import { TPartitionId, TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { getTab } from './helpers';

const scopeLog = log.scope('ChangeTabProfileCommand');

export interface ICommandParams {
  tabId?: TTabId;
  partitionId: TPartitionId;
}

export const TRIGGER = 'change-tab-profile';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Change Tab Profile',
  description: 'Changes the profile of the current tab.',
  visibility: ({ tab }) => !!tab,
  modal: {
    page: 'change-tab-profile',
  },
  async handler({ browser, window, tab, params }) {
    const affectedTab = getTab(browser, tab!, params?.tabId);
    if (!affectedTab) {
      scopeLog.warn('No tab available.');
      return;
    }

    const url = affectedTab.url;
    if (!url) {
      scopeLog.warn('Tab has no URL.');
      return;
    }

    window.closeTab(affectedTab.id);
    browser.openURL(url, {
      partitionId: params?.partitionId,
      selectTab: true,
    });
  },
};
