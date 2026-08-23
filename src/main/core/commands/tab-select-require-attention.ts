import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'select-first-tab-require-attention';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:selectFirstTabRequireAttention.name'),
  description: () => t('commands:selectFirstTabRequireAttention.description'),
  visibility: ({ window }) => (window ? window.tabsRequireAttention.length > 0 : false),
  async handler({ window, tab }) {
    const nextTab = window.tabsRequireAttention[0];
    if (!nextTab) {
      if (window.whoInitiateRequireAttention) {
        window.selectTab(window.whoInitiateRequireAttention);
        window.setWhoInitiateRequireAttention(null);
      }

      return;
    }

    if (!window.whoInitiateRequireAttention && tab) {
      window.setWhoInitiateRequireAttention(tab.id);
    }

    window.selectTab(nextTab.tab.id);
  },
};
