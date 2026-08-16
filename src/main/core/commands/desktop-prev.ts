import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'previous-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.previousDesktop.name',
  description: 'commands.previousDesktop.description',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectDesktop('prev');
  },
};
