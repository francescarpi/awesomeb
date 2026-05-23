import { notification } from '@/core';
import type { ICommand } from './types';
import type { TTabId } from '~/types';
import { clipboard } from 'electron';
import log from 'electron-log';
import { getTab } from './helpers';

const scopeLog = log.scope('CopyURLCommand');

export interface ICommandParams {
  tabId?: TTabId;
}

export const TRIGGER = 'copy-url';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Copy URL',
  description: 'Copy the URL of the active tab to the clipboard.',
  visibility: ({ tab }) => !!tab,
  async handler({ tab, window, browser, params }) {
    const targetTab = getTab(browser, tab, params?.tabId);
    if (!targetTab || !targetTab.url || !window) {
      scopeLog.warn('No active tab or URL to copy');
      return;
    }
    clipboard.writeText(targetTab.url);
    notification('URL Copied', 'URL of the active tab copied to clipboard');
  },
};
