import { TDesktopId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('RenameDesktopCommand');

export interface ICommandParams {
  desktopId: TDesktopId;
  name: string;
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
  visibility: ({ window }) => !!window,
  async handler({ window, params }) {
    const desktop = window.getDesktop(params.desktopId);
    if (!desktop) {
      scopeLog.error(`Desktop with ID ${params.desktopId} not found`);
      return;
    }

    desktop.setName(params.name);
  },
};
