import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'minimize-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Minimize Window',
  description: 'Minimizes the specified window',
  visibility: ({ focusedWindow }) => !!focusedWindow && !focusedWindow.bw.isMinimized(),
  async handler(_browser, window, _params) {
    window.bw.minimize();
  },
};
