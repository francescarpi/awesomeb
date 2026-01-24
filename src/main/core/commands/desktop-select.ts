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
  page: 'select-desktop',
  visibility: ({ focusedWindow }) => !!focusedWindow,
  async handler(_browser, window, params) {
    window.goDesktop(params.desktopId);
  },
};
