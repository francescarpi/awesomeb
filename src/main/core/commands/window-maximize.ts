import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'maximize-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:maximizeWindow.name'),
  description: () => t('commands:maximizeWindow.description'),
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    if (window.bw.isMaximized()) {
      window.bw.unmaximize();
    } else {
      window.bw.maximize();
    }
  },
};
