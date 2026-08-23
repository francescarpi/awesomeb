import { TDesktopId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('RenameDesktopCommand');

export interface ICommandParams {
  desktopId: TDesktopId;
  shortName: string;
  longName: string;
}

export const TRIGGER = 'rename-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:renameDesktop.name'),
  description: () => t('commands:renameDesktop.description'),
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
