import { ICommand } from './types';
import { TTabId } from '~/types';
import log from 'electron-log';
import { getTab } from './helpers';

const scopeLog = log.scope('ToggleMuteCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'toggle-mute';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Toggle Mute',
  description: 'Toggles the mute state of the current tab.',
  visibility: ({ tab }) => !!tab,
  async handler({ tab, browser, params }) {
    const targetTab = getTab(browser, tab!, params?.tabId);
    if (!targetTab) {
      scopeLog.warn('No tab available');
      return;
    }

    targetTab.toggleMute();
  },
};
