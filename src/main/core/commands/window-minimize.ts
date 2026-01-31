import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'minimize-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Minimize Window',
  description: 'Minimizes the specified window',
  visibility: ({ window }) => !!window && !window.bw.isMinimized(),
  async handler({ window }) {
    window.bw.minimize();
  },
};
