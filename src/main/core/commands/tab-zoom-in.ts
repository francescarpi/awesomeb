import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'zoom-in';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.zoomIn.name',
  description: 'commands.zoomIn.description',
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.setZoom('in');
    }
  },
};
