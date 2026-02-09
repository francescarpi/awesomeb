import { TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('EditURLCommand');

export interface ICommandParams {
  tabId: TTabId;
  url: string;
}

export const TRIGGER = 'edit-url';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Edit URL',
  description: 'Edit the URL of the active tab',
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
    result.tab.loadURL(url);
  },
};
