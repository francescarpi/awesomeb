import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('AcceptTabPreviewCommand');

export interface ICommandParams {}

export const TRIGGER = 'accept-tab-preview';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Accept Tab Preview',
  description: 'Accept the preview of the current tab',
  visibility: ({ tab }) => !!tab?.tabPreview,
  async handler({ browser, tab }) {
    if (!tab) {
      scopeLog.warn('No tab found ');
      return;
    }

    browser.acceptTabPreview(tab.id);
  },
};
