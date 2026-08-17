import { ICommand } from './types';
import { clipboard, app } from 'electron';
import { notification } from '@/core';

export interface ICommandParams {}

export const TRIGGER = 'copy-version';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Copy Version',
  description: 'Copy App version to the clipboard',
  async handler({}) {
    clipboard.writeText(app.getVersion());
    notification('Version Copied', `Version text "${app.getVersion()}" copied to clipboard`);
  },
};
