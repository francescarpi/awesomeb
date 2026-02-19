import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'toggle-maximize-area';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Toggle Maximize Area',
  description:
    'Toggle the maximization of the main content area by hiding or showing the sidebar and urlbar.',
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.toggleMaximizeArea();
  },
};
