import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'next-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Next Desktop',
  description: 'Switch to the next desktop',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectDesktop('next');
  },
};
