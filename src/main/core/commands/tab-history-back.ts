import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';

const scopeLog = log.scope('GoBackCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'go-back';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Go Back',
  description: 'Navigates back in the browsing history of the specified tab.',
  visibility: ({ tab }) => !!tab && tab.canGoBack,
  async handler({ browser, tab, params }) {
    const tabToReload = getTab(browser, tab, params?.tabId);
    if (!tabToReload) {
      scopeLog.warn('No tab available');
      return;
    }

    tabToReload.clearFailLoad();
    tabToReload.goBack();
  },
};
