import { ICommand } from './types';
import { INTERNAL_PROTOCOL } from '~/constants';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'manage-bookmarks';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:bookmarksManage.name'),
  description: () => t('commands:bookmarksManage.description'),
  visibility: ({ window }) => !!window,
  async handler({ browser }) {
    browser.openURL(`${INTERNAL_PROTOCOL}://bookmarks`, {
      selectTab: true,
    });
  },
};
