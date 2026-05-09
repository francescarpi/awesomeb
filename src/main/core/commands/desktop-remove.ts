import { ICommand } from './types';
import { MIN_DESKTOPS } from '../window/constants';

export interface ICommandParams {}

export const TRIGGER = 'remove-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Remove Desktop',
  description: 'Remove the current desktop',
  visibility: ({ window, desktop }) =>
    !!window && !!desktop && !desktop.hasTabs && window.desktops.length > MIN_DESKTOPS,
  async handler({ window, desktop }) {
    window.closeDesktop(desktop.id);
  },
};
