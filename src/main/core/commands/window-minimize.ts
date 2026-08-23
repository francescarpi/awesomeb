import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'minimize-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:minimizeWindow.name'),
  description: () => t('commands:minimizeWindow.description'),
  visibility: ({ window }) => !!window && !window.bw.isMinimized(),
  async handler({ window }) {
    window.bw.minimize();
  },
};
