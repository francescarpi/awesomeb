import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'toggle-sidebar';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Toggle Sidebar',
  description: 'Toggles the visibility of the sidebar in the focused window.',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.toggleSidebar();
  },
};
