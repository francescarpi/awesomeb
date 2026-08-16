import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'move-desktop-right';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.moveDesktopRight.name',
  description: 'commands.moveDesktopRight.description',
  visibility: ({ window }) => !!window,
  async handler({ window, desktop }) {
    window.moveDesktop(desktop.id, 'right');
  },
};
