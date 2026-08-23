import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'next-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:nextDesktop.name'),
  description: () => t('commands:nextDesktop.description'),
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectDesktop('next');
  },
};
