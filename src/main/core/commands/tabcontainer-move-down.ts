import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'move-tab-container-down';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Move Tab Container Down',
  description: 'Move the current tab container down in the list.',
  visibility: ({ tabContainer }) => !!tabContainer,
  async handler({ desktop, tabContainer }) {
    if (tabContainer) {
      desktop.moveTabContainer(tabContainer.id, 'down');
    }
  },
};
