import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'move-desktop-right';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:moveDesktopRight.name'),
  description: () => t('commands:moveDesktopRight.description'),
  visibility: ({ window }) => !!window,
  async handler({ window, desktop }) {
    window.moveDesktop(desktop.id, 'right');
  },
};
