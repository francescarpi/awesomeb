import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'previous-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:previousTab.name'),
  description: () => t('commands:previousTab.description'),
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectTab('prev', { sameDesktop: true });
  },
};
