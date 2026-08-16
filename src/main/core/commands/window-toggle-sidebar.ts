import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'toggle-sidebar';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.toggleSidebar.name',
  description: 'commands.toggleSidebar.description',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.toggleSidebar(window);
  },
};
