import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('CertificateInfoCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'certificate-info';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:certificateInfo.name'),
  description: () => t('commands:certificateInfo.description'),
  visibility: ({ tab }) => !!tab && tab.safe,
  modal: {
    page: 'certificate-info',
  },
  async handler({ browser, tab, params }) {
    const tabToRename = getTab(browser, tab, params?.tabId);
    if (!tabToRename) {
      scopeLog.warn('No tab available');
      return;
    }
  },
};
