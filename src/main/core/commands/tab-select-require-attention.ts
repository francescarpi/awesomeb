import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'select-first-tab-require-attention';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Select First Tab Requiring Attention',
  description: 'Select the first tab that has a badge indicating it requires attention.',
  visibility: ({ window }) => (window ? window.tabsRequireAttention.length > 0 : false),
  async handler({ window }) {
    const nextTab = window.tabsRequireAttention[0];
    if (nextTab) {
      window.selectTab(nextTab.tab.id);
    }
  },
};
