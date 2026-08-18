import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'zoom-reset';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Zoom Reset',
  description: 'Reset default zoom of selected tab',
  visibility: ({ tab }) => !!tab && tab.getZoomFactor() !== 1,
  async handler({ tab }) {
    if (tab) {
      tab.setZoom('reset');
    }
  },
};
