import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';

const scopeLog = log.scope('StopLoadingCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'stop-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Stop loading tab',
  description: 'Stop loading the current tab or a specified tab',
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
