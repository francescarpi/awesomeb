import { ICommand } from './types';
import log from 'electron-log';
import { t } from '~/i18n';

const scopeLog = log.scope('AcceptTabPreviewCommand');

export interface ICommandParams {}

export const TRIGGER = 'accept-tab-preview';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:acceptTabPreview.name'),
  description: () => t('commands:acceptTabPreview.description'),
  visibility: ({ tab }) => !!tab?.tabPreview,
  async handler({ browser, tab }) {
    if (!tab) {
      scopeLog.warn('No tab found ');
      return;
    }

    browser.acceptTabPreview(tab.id);
  },
};
