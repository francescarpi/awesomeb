import { Browser, Window } from '@/core';
import { TPartitionId } from '~/types';

export class ChromeAction {
  constructor(private readonly browser: Browser) {}

  async setIcon(
    _window: Window,
    _partitionId: TPartitionId,
    extensionId: string,
    details: chrome.action.TabIconDetails,
  ): Promise<void> {
    this.browser.extensions.updateIcon(extensionId, details);
  }
}
