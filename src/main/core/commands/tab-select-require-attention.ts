import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'select-first-tab-require-attention';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.selectFirstTabRequireAttention.name',
  description: 'commands.selectFirstTabRequireAttention.description',
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
