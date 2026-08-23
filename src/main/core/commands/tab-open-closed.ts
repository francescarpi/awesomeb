import { ICommand } from './types';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('OpenClosedCommand');

export interface ICommandParams {
  id: string;
}

export const TRIGGER = 'open-closed';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:openClosed.name'),
  description: () => t('commands:openClosed.description'),
  modal: {
    page: 'open-closed',
  },
  visibility: ({ browser }) => browser.hasClosedTabs,
  async handler({ params, browser }) {
    const tab = browser.getTab(parseInt(params.id, 10));
    if (!tab) {
      scopeLog.warn(`No tab found with id: ${params.id}`);
      return;
    }
    tab.window.openClosedTab(tab.tab.id);
  },
};
