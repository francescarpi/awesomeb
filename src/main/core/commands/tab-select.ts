import { TTabId } from '~/types';
import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {
  tabId: TTabId;
}

export const TRIGGER = 'select-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:selectTab.name'),
  description: () => t('commands:selectTab.description'),
  visibility: ({ tab }) => !!tab,
  async handler({ window, params }) {
    await window.selectTab(params.tabId);
    window.setWhoInitiateRequireAttention(null);
  },
};
