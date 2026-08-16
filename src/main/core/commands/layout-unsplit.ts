import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('UnsplitTabsCommand');

export interface ICommandParams {}

export const TRIGGER = 'unsplit-tabs';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.unsplitTabs.name',
  description: 'commands.unsplitTabs.description',
  visibility: ({ tabContainer }) => (tabContainer && tabContainer.isSplit ? true : false),
  async handler({ tabContainer, browser }) {
    if (!tabContainer) {
      scopeLog.warn(`No tab container found for ${TRIGGER} command`);
      return;
    }

    browser.unsplitTabContainer(tabContainer.id);
  },
};
