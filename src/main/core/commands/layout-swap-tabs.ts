import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('SwapTabsCommand');

export interface ICommandParams {}

export const TRIGGER = 'swap-tabs';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.swapTabs.name',
  description: 'commands.swapTabs.description',
  visibility: ({ tabContainer }) => (tabContainer && tabContainer.isSplit ? true : false),
  async handler({ tabContainer }) {
    if (!tabContainer) {
      scopeLog.warn(`No tab container found for ${TRIGGER} command`);
      return;
    }
    tabContainer.rotateTabs(true);
  },
};
