import { ICommand } from './types';
import { MAX_DESKTOPS } from '../window/constants';

export interface ICommandParams {}

export const TRIGGER = 'add-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Add Desktop',
  description: 'Add a new desktop',
  visibility: ({ window }) => !!window && window.desktops.length < MAX_DESKTOPS,
  async handler({ window }) {
    window.createDesktop(window.desktops.length + 1);
  },
};
