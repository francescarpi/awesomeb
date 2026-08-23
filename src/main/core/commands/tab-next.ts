import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'next-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:nextTab.name'),
  description: () => t('commands:nextTab.description'),
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.selectTab('next', { sameDesktop: true });
  },
};
