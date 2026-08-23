import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('StopLoadingCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'stop-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:stopTab.name'),
  description: () => t('commands:stopTab.description'),
  visibility: ({ tab }) => !!tab && tab.webContentsLoading,
  async handler({ browser, tab, params }) {
    const tabToReload = getTab(browser, tab, params?.tabId);
    if (!tabToReload) {
      scopeLog.warn('No tab available');
      return;
    }

    tabToReload.webContents.stop();
  },
};
