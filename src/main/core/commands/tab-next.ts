import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'next-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Next Tab',
  description: 'Switch to the next tab in the current window',
  visibility: ({ focusedWindow }) => !!focusedWindow,
  async handler({ window }) {
    window.selectTab('next');
  },
};
