import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('SplitTabPreviewCommand');

export interface ICommandParams {}

export const TRIGGER = 'split-tab-preview';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.splitTabPreview.name',
  description: 'commands.splitTabPreview.description',
  visibility: ({ tab }) => !!tab?.tabPreview,
  async handler({ browser, tab }) {
    if (!tab) {
      scopeLog.warn('No tab found');
      return;
    }

    browser.splitTabPreview(tab.id);
  },
};
