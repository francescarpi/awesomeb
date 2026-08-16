import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'previous-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.previousTab.name',
  description: 'commands.previousTab.description',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectTab('prev', { sameDesktop: true });
  },
};
