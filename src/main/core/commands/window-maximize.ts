import { ICommand } from './types';

export interface ICommandParams {}

// TODO tots els command reben un winId y es comproba al performCommand
// el handler reb el "window" (instancia)

export const TRIGGER = 'maximize-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Maximize Window',
  description: 'Maximize the specified window',
  visibility: ({ focusedWindow }) => !!focusedWindow && !focusedWindow.bw.isMaximized(),
  async handler(browser, {}) {},
};
