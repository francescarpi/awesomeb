import { ICommand } from './types';
import { TTabId } from '~/types';
import log from 'electron-log';
import { getTab } from './helpers';
import { t } from '~/i18n';

const scopeLog = log.scope('ToggleMuteCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'toggle-mute';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:toggleMute.name'),
  description: () => t('commands:toggleMute.description'),
  visibility: ({ tab }) => !!tab,
  async handler({ tab, browser, params }) {
    const targetTab = getTab(browser, tab, params?.tabId);
    if (!targetTab) {
      scopeLog.warn('No tab available');
      return;
    }

    targetTab.toggleMute();
  },
};
