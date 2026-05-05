import { TTabId } from '~/types';
import { ICommand } from './types';
import { getTab } from './helpers';
import log from 'electron-log';

const scopeLog = log.scope('RenameTabCommand');

export interface ICommandParams {
  tabId?: TTabId;
  name: string;
}

export const TRIGGER = 'rename-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Rename Tab',
  description: 'Renames the specified tab.',
  visibility: ({ tab }) => !!tab,
  modal: {
    page: 'rename-tab',
  },
  async handler({ browser, tab, params }) {
    const tabToRename = getTab(browser, tab, params?.tabId);
    if (!tabToRename) {
      scopeLog.warn('No tab available');
      return;
    }

    tabToRename.setCustomTitle(params.name);
    scopeLog.info(`Renamed tab ${tabToRename.id} to "${params.name}"`);
  },
};
