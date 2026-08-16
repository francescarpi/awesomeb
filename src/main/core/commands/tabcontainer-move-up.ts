import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'move-tab-container-up';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.moveTabContainerUp.name',
  description: 'commands.moveTabContainerUp.description',
  visibility: ({ tabContainer }) => !!tabContainer,
  async handler({ desktop, tabContainer }) {
    if (tabContainer) {
      desktop.moveTabContainer(tabContainer.id, 'up');
    }
  },
};
