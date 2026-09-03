import { ICommand } from './types';
import { t } from '~/i18n';
import log from 'electron-log';

const scopeLog = log.scope('ViewTabSource');

export interface ICommandParams {}

export const TRIGGER = 'view-tab-source';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:viewTabSource.name'),
  description: () => t('commands:viewTabSource.description'),
  visibility: ({ tab }) => !!tab,
  async handler({ tab, browser }) {
    if (!tab || !tab.url) {
      scopeLog.warn('No tab or url');
      return;
    }
    browser.openURL(`view-source:${tab.url}`, { selectTab: true });
  },
};
