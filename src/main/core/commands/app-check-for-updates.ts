import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'check-for-updates';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:checkForUpdates.name'),
  description: () => t('commands:checkForUpdates.description'),
  visibility: ({ browser }) => !browser.appUpdater.isChecking,
  async handler({ browser }) {
    browser.appUpdater.checkForUpdates(true);
  },
};
