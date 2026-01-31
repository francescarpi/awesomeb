import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'previous-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Previous Tab',
  description: 'Switch to the previous tab in the current window',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectTab('prev');
  },
};
