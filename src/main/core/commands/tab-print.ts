import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('PrintTabCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'print';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:print.name'),
  description: () => t('commands:print.description'),
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
