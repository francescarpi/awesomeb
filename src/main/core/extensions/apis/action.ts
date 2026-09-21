import { Browser, Window } from '@/core';
import { TPartitionId, IExtension } from '~/types';

export class ChromeAction {
  constructor(private readonly browser: Browser) {}

  async setIcon(
    _window: Window,
    _partitionId: TPartitionId,
    extension: IExtension,
    details: chrome.action.TabIconDetails,
  ): Promise<void> {
    this.browser.extensions.updateIcon(extension.id, details);
  }
}
