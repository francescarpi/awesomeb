import { TTabId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('SelectTabCommand');

export interface ICommandParams {
  tabId: TTabId;
}

export const TRIGGER = 'select-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Select Tab',
  description: 'Selects a tab by its ID in the focused window.',
  visibility: ({ tab }) => !!tab,
  async handler({ browser, window, params }) {
    const targetTab = browser.getTab(params.tabId);
    if (!targetTab) {
      scopeLog.warn(`Tab with ID ${params.tabId} not found.`);
      return;
    }

    await window.selectTab(params.tabId);
  },
};
