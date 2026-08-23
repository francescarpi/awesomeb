import { TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('EditURLCommand');

export interface ICommandParams {
  tabId: TTabId;
  url: string;
}

export const TRIGGER = 'edit-url';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:editUrl.name'),
  description: () => t('commands:editUrl.description'),
  modal: {
    page: 'edit-url',
  },
  visibility: ({ tab }) => !!tab,
  async handler({ params, browser }) {
    const { tabId, url } = params;
    const result = browser.getTab(tabId);
    if (!result) {
      scopeLog.error(`Tab with id ${tabId} not found`);
      return;
    }

    result.tab.clearFailLoad();
    result.tab.cleanCertificateError();
    result.tab.setLoading(false);
    result.tab.loadURL(url);
  },
};
