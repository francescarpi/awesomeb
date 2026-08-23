import { ICommand } from './types';
import { INTERNAL_PROTOCOL } from '~/constants';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'manage-extensions';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:manageExtensions.name'),
  description: () => t('commands:manageExtensions.description'),
  async handler({ browser }) {
    browser.openURL(`${INTERNAL_PROTOCOL}://extensions`, {
      selectTab: true,
    });
  },
};
