import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'previous-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Previous Desktop',
  description: 'Switch to the previous desktop',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectDesktop('prev');
  },
};
