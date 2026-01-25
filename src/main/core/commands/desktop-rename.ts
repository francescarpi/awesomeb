import { TDesktopId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('RenameDesktopCommand');

export interface ICommandParams {
  desktopId: TDesktopId;
  newName: string;
}

export const TRIGGER = 'rename-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Rename Desktop',
  description: 'Rename the current virtual desktop',
  modal: {
    page: 'rename-desktop',
    props: {
      height: 150,
    },
  },
  visibility: ({ focusedWindow }) => !!focusedWindow,
  async handler(_browser, window, params) {
    const desktop = window.selectDesktop(params.desktopId);
    if (!desktop) {
      scopeLog.error(`Desktop with ID ${params.desktopId} not found`);
      return;
    }

    desktop.setName(params.newName);
  },
};
