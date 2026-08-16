import { ICommand } from './types';
import { MAX_DESKTOPS } from '../window/constants';

export interface ICommandParams {}

export const TRIGGER = 'add-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.addDesktop.name',
  description: 'commands.addDesktop.description',
  visibility: ({ window }) => !!window && window.desktops.length < MAX_DESKTOPS,
  async handler({ window }) {
    window.createDesktop(window.desktops.length + 1);
  },
};
