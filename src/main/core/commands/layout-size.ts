import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('LayoutSizeCommand');

export interface ICommandParams {
  size: number;
}

export const TRIGGER = 'change-layout-size';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.changeLayoutSize.name',
  description: 'commands.changeLayoutSize.description',
  visibility: ({ tabContainer }) => (tabContainer && tabContainer.isSplit ? true : false),
  modal: {
    page: 'layout-size',
  },
  async handler({ tabContainer, params }) {
    if (!tabContainer) {
      scopeLog.warn(`No tab container found for ${TRIGGER} command`);
      return;
    }
    tabContainer.setLayoutSize(params.size);
  },
};
