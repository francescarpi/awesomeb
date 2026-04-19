import { Browser, Window } from '@/core';
import { TPartitionId } from '~/types';
import log from 'electron-log';
import { loadIcon } from '../helpers';
import * as path from 'path';

const scopeLog = log.scope('ChromeAction');

export class ChromeAction {
  constructor(private readonly browser: Browser) {}

  async setIcon(
    _window: Window,
    _partitionId: TPartitionId,
    extensionId: string,
    details: chrome.action.TabIconDetails,
  ): Promise<void> {
    const ext = this.browser.extensions.getExtension(extensionId);
    if (!ext) {
      scopeLog.warn(`Extension with id ${extensionId} not found`);
      return;
    }

    const icon = loadIcon(
      ext.manifestPath,
      details.path ? path.join('popup', details.path as string) : undefined,
    );

    console.log('ICON', icon);

    // ext.setIcon(details);
  }
}
