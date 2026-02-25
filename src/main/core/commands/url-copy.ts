import { notification } from '@/core';
import { ICommand } from './types';
import { clipboard } from 'electron';

export interface ICommandParams {}

export const TRIGGER = 'copy-url';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Copy URL',
  description: 'Copy the URL of the active tab to the clipboard.',
  visibility: ({ tab }) => !!tab,
  async handler({ tab, window }) {
    if (tab && tab.url && window) {
      clipboard.writeText(tab.url);
      notification('URL Copied', 'URL of the active tab copied to clipboard');
    }
  },
};
