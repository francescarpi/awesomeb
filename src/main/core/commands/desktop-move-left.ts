import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'move-desktop-left';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.moveDesktopLeft.name',
  description: 'commands.moveDesktopLeft.description',
  visibility: ({ window }) => !!window,
  async handler({ window, desktop }) {
    window.moveDesktop(desktop.id, 'left');
  },
};
