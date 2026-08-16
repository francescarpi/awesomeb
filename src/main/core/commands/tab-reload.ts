import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';

const scopeLog = log.scope('ReloadTabCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'reload-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.reloadTab.name',
  description: 'commands.reloadTab.description',
  visibility: ({ tab }) => !!tab,
  async handler({ browser, tab, params }) {
    const tabToReload = getTab(browser, tab, params?.tabId);
    if (!tabToReload) {
      scopeLog.warn('No tab available');
      return;
    }

    tabToReload.clearFailLoad();
    tabToReload.cleanCertificateError();
    tabToReload.setLoading(false);
    tabToReload.reload();
  },
};
