import { TDesktopId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('RemoveAllDividersCommand');

export interface ICommandParams {
  desktopId: TDesktopId;
}

export const TRIGGER = 'remove-all-dividers';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:removeAllDividers.name'),
  description: () => t('commands:removeAllDividers.description'),
  modal: {
    page: TRIGGER,
  },
  visibility: ({ desktop }) => (desktop ? desktop.tabContainers.length > 0 : false),
  async handler({ params, window }) {
    const desktop = window.getDesktop(params.desktopId);
    if (!desktop) {
      scopeLog.error(`Desktop with ID ${params.desktopId} not found.`);
      return;
    }

    for (const tabContainer of desktop.tabContainers) {
      tabContainer.setDivider(false);
    }
  },
};
