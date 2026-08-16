import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'next-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.nextDesktop.name',
  description: 'commands.nextDesktop.description',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectDesktop('next');
  },
};
