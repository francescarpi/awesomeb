import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'toggle-maximize-area';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.toggleMaximizeArea.name',
  description: 'commands.toggleMaximizeArea.description',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.toggleMaximizeArea(window);
  },
};
