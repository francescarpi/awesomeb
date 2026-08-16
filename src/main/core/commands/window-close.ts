import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'close-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.closeWindow.name',
  description: 'commands.closeWindow.description',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.bw.close();
  },
};
