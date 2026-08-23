import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('GoBackCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'go-back';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:goBack.name'),
  description: () => t('commands:goBack.description'),
  visibility: ({ tab }) => !!tab && tab.canGoBack,
  async handler({ browser, tab, params }) {
    const tabToReload = getTab(browser, tab, params?.tabId);
    if (!tabToReload) {
      scopeLog.warn('No tab available');
      return;
    }

    tabToReload.clearFailLoad();
    tabToReload.cleanCertificateError();
    tabToReload.goBack();
  },
};
