import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'add-desktop-tabs-to-bookmarks';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:bookmarksAddDesktop.name'),
  description: () => t('commands:bookmarksAddDesktop.description'),
  visibility: ({ desktop }) => desktop !== null && desktop.hasTabs,
  modal: {
    page: 'bookmarks-desktop-save',
  },
  async handler({}) {},
};
