import { ICommand } from './types';
import { INTERNAL_PROTOCOL } from '~/constants';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'debug-page';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:debugPage.name'),
  description: () => t('commands:debugPage.description'),
  visibility: ({ window }) => !!window,
  async handler({ browser }) {
    browser.openURL(`${INTERNAL_PROTOCOL}://debug/`, { selectTab: true });
  },
};
