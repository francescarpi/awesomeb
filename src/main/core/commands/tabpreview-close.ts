import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('CloseTabPreviewCommand');

export interface ICommandParams {}

export const TRIGGER = 'close-tab-preview';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.closeTabPreview.name',
  description: 'commands.closeTabPreview.description',
  visibility: ({ tab }) => !!tab?.tabPreview,
  async handler({ browser, tab }) {
    if (!tab) {
      scopeLog.warn('No tab found');
      return;
    }

    browser.closeTabPreview(tab.id);
  },
};
