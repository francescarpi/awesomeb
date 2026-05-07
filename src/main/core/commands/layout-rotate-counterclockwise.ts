import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('RotateTabsCounterclockwiseCommand');

export interface ICommandParams {}

export const TRIGGER = 'rotate-tabs-counterclockwise';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Rotate tabs counterclockwise',
  description: 'Rotate the order of tabs in the current container counterclockwise',
  visibility: ({ tabContainer }) => (tabContainer && tabContainer.isSplit ? true : false),
  async handler({ tabContainer }) {
    if (!tabContainer) {
      scopeLog.warn(`No tab container found for ${TRIGGER} command`);
      return;
    }
    tabContainer.rotateTabs(false);
  },
};
