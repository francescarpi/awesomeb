import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'close-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Close Window',
  description: 'Close the specified window',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.bw.close();
  },
};
