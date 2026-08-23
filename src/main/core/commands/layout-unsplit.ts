import { ICommand } from './types';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('UnsplitTabsCommand');

export interface ICommandParams {}

export const TRIGGER = 'unsplit-tabs';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:unsplitTabs.name'),
  description: () => t('commands:unsplitTabs.description'),
  visibility: ({ tabContainer }) => (tabContainer && tabContainer.isSplit ? true : false),
  async handler({ tabContainer, browser }) {
    if (!tabContainer) {
      scopeLog.warn(`No tab container found for ${TRIGGER} command`);
      return;
    }

    browser.unsplitTabContainer(tabContainer.id);
  },
};
