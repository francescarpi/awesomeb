import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'add-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Add Desktop',
  description: 'Add a new desktop',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.createDesktop(window.desktops.length + 1);
  },
};
