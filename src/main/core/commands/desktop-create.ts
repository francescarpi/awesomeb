import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'create-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Create Desktop',
  description: 'Create a new desktop',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.createDesktop(window.desktops.length + 1);
  },
};
