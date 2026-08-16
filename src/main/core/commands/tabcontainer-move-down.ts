import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'move-tab-container-down';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.moveTabContainerDown.name',
  description: 'commands.moveTabContainerDown.description',
  visibility: ({ tabContainer }) => !!tabContainer,
  async handler({ desktop, tabContainer }) {
    if (tabContainer) {
      desktop.moveTabContainer(tabContainer.id, 'down');
    }
  },
};
