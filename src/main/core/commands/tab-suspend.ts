import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'suspend-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Suspend Tab',
  description: 'Suspends the currently active tab in the focused window.',
  visibility: ({ tab }) => !!tab,
  async handler({ window, tab }) {
    if (!tab) {
      throw new Error('No active tab to suspend.');
    }

    window.suspendTab(tab.id);
  },
};
