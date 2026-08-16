import { TDesktopId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('RenameDesktopCommand');

export interface ICommandParams {
  desktopId: TDesktopId;
  shortName: string;
  longName: string;
}

export const TRIGGER = 'rename-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.renameDesktop.name',
  description: 'commands.renameDesktop.description',
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

    desktop.setName(params.shortName, params.longName);
  },
};
