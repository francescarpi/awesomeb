import { notification, isValidUrl } from '@/core';
import { clipboard } from 'electron';
import type { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'tab-new-from-clipboard';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Paste & Go',
  description: 'Open a new tab from the URL in the clipboard.',
  visibility: ({ window }) => !!window,
  async handler({ browser, window: _window }) {
    const clipboardText = clipboard.readText().trim();

    if (!clipboardText) {
      notification('Paste & Go', 'Clipboard is empty');
      return;
    }

    const { valid, url } = isValidUrl(clipboardText);

    if (!valid) {
      notification('Paste & Go', 'No valid URL found in clipboard');
      return;
    }

    await browser.openURL(url, { selectTab: true });
  },
};
