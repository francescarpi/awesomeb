import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'find-in-page';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:findInPage.name'),
  description: () => t('commands:findInPage.description'),
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.startFindInPage();
    }
  },
};
