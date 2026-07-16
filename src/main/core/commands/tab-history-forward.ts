import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';

const scopeLog = log.scope('GoForwardCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'go-forward';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Go Forward',
  description: 'Navigates forward in the browsing history of the specified tab.',
  visibility: ({ tab }) => !!tab && tab.canGoForward,
  async handler({ browser, tab, params }) {
    const tabToReload = getTab(browser, tab, params?.tabId);
    if (!tabToReload) {
      scopeLog.warn('No tab available');
      return;
    }

    tabToReload.clearFailLoad();
    tabToReload.cleanCertificateError();
    tabToReload.goForward();
  },
};
