import { TDesktopId } from '~/types';
import { ICommand } from './types';

export interface ICommandParams {
  desktopId: TDesktopId;
}

export const TRIGGER = 'select-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Select Desktop',
  description: 'Switch to a specific desktop',
  modal: {
    page: 'select-desktop',
  },
  visibility: ({ window }) => !!window,
  async handler({ window, params }) {
    // TODO if desktopId is the selected one, back to previous desktop

    window.selectDesktop(params.desktopId);
  },
};
