import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'move-desktop-left';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Move Desktop Left',
  description: 'Move the current desktop one position to the left',
  visibility: ({ window }) => !!window,
  async handler({ window, desktop }) {
    window.moveDesktop(desktop.id, 'left');
  },
};
