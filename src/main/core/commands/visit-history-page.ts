import { ICommand } from './types';
import { INTERNAL_PROTOCOL } from '~/constants';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'manage-history';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:manageHistory.name'),
  description: () => t('commands:manageHistory.description'),
  visibility: ({ window }) => !!window,
  async handler({ browser }) {
    browser.openURL(`${INTERNAL_PROTOCOL}://history/`, { selectTab: true });
  },
};
