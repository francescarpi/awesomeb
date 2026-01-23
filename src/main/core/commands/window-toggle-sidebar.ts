import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'toggle-sidebar';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Toggle Sidebar',
  description: 'Toggles the visibility of the sidebar in the focused window.',
  visibility: ({ focusedWindow }) => !!focusedWindow,
  async handler(_browser, window, _params) {
    window.toggleSidebar();
  },
};
