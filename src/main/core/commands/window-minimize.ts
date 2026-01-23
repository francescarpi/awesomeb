import { ICommand } from './types';

export interface ICommandParams {}

// TODO tots els command reben un winId y es comproba al performCommand
// el handler reb el "window" (instancia)

export const TRIGGER = 'minimize-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Minimize Window',
  description: 'Minimizes the specified window',
  visibility: ({ focusedWindow }) => !!focusedWindow && !focusedWindow.bw.isMinimized(),
  async handler(browser, {}) {},
};
