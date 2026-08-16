import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'maximize-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.maximizeWindow.name',
  description: 'commands.maximizeWindow.description',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    if (window.bw.isMaximized()) {
      window.bw.unmaximize();
    } else {
      window.bw.maximize();
    }
  },
};
