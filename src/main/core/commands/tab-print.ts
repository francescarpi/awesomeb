import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';

const scopeLog = log.scope('PrintTabCo');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'print';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Print',
  description: 'Print the current page',
  visibility: ({ tab }) => !!tab && tab.canGoBack,
  async handler({ browser, tab, params }) {
    const targetTab = getTab(browser, tab, params?.tabId);
    if (!targetTab) {
      scopeLog.warn('No tab available');
      return;
    }

    targetTab.print();
  },
};
