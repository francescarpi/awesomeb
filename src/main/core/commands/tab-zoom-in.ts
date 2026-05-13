import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'zoom-in';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Zoom In',
  description: 'Increase zoom level of the current tab',
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.setZoom('in');
    }
  },
};
