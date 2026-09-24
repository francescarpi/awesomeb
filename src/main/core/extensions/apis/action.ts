import { Browser, Window } from '@/core';
import { IExtension } from '~/types';

export class ChromeAction {
  constructor(private readonly browser: Browser) {}

  async setIcon(
    _window: Window,
    extension: IExtension,
    details: chrome.action.TabIconDetails,
    callerUrl?: string,
  ): Promise<void> {
    this.browser.extensions.updateIcon(extension.id, details, callerUrl);
  }
}
