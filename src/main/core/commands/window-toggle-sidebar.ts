import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'toggle-sidebar';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:toggleSidebar.name'),
  description: () => t('commands:toggleSidebar.description'),
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.toggleSidebar(window);
  },
};
