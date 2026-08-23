import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'toggle-maximize-area';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:toggleMaximizeArea.name'),
  description: () => t('commands:toggleMaximizeArea.description'),
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.toggleMaximizeArea(window);
  },
};
