import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'move-tab-container-up';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Move Tab Container Up',
  description: 'Move the current tab container up in the list.',
  visibility: ({ tabContainer }) => !!tabContainer,
  async handler({ desktop, tabContainer }) {
    if (tabContainer) {
      desktop.moveTabContainer(tabContainer.id, 'up');
    }
  },
};
