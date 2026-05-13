import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'zoom-out';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Zoom Out',
  description: 'Decrease zoom level of the current tab',
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.setZoom('out');
    }
  },
};
