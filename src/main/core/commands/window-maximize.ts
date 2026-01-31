import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'maximize-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Maximize Window',
  description: 'Maximize the specified window',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    if (window.bw.isMaximized()) {
      window.bw.unmaximize();
    } else {
      window.bw.maximize();
    }
  },
};
