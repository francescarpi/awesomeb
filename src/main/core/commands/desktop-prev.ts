import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'previous-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Previous Desktop',
  description: 'Switch to the previous desktop',
  visibility: ({ focusedWindow }) => !!focusedWindow,
  async handler({ window }) {
    window.selectDesktop('prev');
  },
};
