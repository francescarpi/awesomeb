import { ICommand } from './types';
import { notification } from '@/core';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'save-session';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:saveSession.name'),
  description: () => t('commands:saveSession.description'),
  async handler({ browser }) {
    browser.saveSession();
    notification(t('notifications:sessionSaved.title'), t('notifications:sessionSaved.body'));
  },
};
