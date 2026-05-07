import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('RotateTabsClockwiseCommand');

export interface ICommandParams {}

export const TRIGGER = 'rotate-tabs-clockwise';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Rotate tabs clockwise',
  description: 'Rotate the order of tabs in the current container clockwise',
  visibility: ({ tabContainer }) => (tabContainer && tabContainer.isSplit ? true : false),
  async handler({ tabContainer }) {
    if (!tabContainer) {
      scopeLog.warn(`No tab container found for ${TRIGGER} command`);
      return;
    }
    tabContainer.rotateTabs(true);
  },
};
