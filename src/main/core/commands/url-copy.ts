import { notification } from '@/core';
import type { ICommand } from './types';
import type { TTabId } from '~/types';
import { clipboard } from 'electron';
import log from 'electron-log';
import { getTab } from './helpers';
import { t } from '~/i18n';

const scopeLog = log.scope('CopyURLCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'copy-url';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:copyUrl.name'),
  description: () => t('commands:copyUrl.description'),
  visibility: ({ tab }) => !!tab,
  async handler({ tab, window, browser, params }) {
    const targetTab = getTab(browser, tab, params?.tabId);
    if (!targetTab || !targetTab.url || !window) {
      scopeLog.warn('No active tab or URL to copy');
      return;
    }
    clipboard.writeText(targetTab.url);
    notification(t('notifications:urlCopied.title'), targetTab.url);
  },
};
