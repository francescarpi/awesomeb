import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'zoom-out';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.zoomOut.name',
  description: 'commands.zoomOut.description',
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.setZoom('out');
    }
  },
};
