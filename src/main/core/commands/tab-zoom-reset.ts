import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'zoom-reset';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.zoomReset.name',
  description: 'commands.zoomReset.description',
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.setZoom('reset');
    }
  },
};
