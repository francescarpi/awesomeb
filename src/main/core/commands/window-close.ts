import { ICommand } from './types';

export interface ICommandParams {}

// TODO tots els command reben un winId y es comproba al performCommand
// el handler reb el "window" (instancia)

export const TRIGGER = 'close-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Close Window',
  description: 'Close the specified window',
  visibility: ({ focusedWindow }) => !!focusedWindow,
  async handler(browser, {}) {},
};
