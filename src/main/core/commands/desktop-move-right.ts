import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'move-desktop-right';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Move Desktop Right',
  description: 'Move the current desktop one position to the right',
  visibility: ({ window }) => !!window,
  async handler({ window, desktop }) {
    window.moveDesktop(desktop.id, 'right');
  },
};
