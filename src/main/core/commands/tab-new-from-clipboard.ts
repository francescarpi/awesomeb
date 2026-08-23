import { notification, isValidUrl } from '@/core';
import { clipboard } from 'electron';
import type { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'tab-new-from-clipboard';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:tabNewFromClipboard.name'),
  description: () => t('commands:tabNewFromClipboard.description'),
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
