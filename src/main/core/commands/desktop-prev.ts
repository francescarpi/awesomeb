import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'previous-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:previousDesktop.name'),
  description: () => t('commands:previousDesktop.description'),
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectDesktop('prev');
  },
};
