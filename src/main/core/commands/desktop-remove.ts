import { ICommand } from './types';
import { MIN_DESKTOPS } from '../window/constants';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'remove-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:removeDesktop.name'),
  description: () => t('commands:removeDesktop.description'),
  visibility: ({ window, desktop }) =>
    !!window && !!desktop && !desktop.hasTabs && window.desktops.length > MIN_DESKTOPS,
  async handler({ window, desktop }) {
    window.closeDesktop(desktop.id);
  },
};
