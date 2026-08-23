import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('GoForwardCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'go-forward';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:goForward.name'),
  description: () => t('commands:goForward.description'),
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
