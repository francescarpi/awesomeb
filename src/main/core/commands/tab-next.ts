import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'next-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.nextTab.name',
  description: 'commands.nextTab.description',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectTab('next', { sameDesktop: true });
  },
};
