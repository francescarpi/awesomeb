import { ICommand } from './types';
import { clipboard, app } from 'electron';
import { notification } from '@/core';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'copy-version';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:copyVersion.name'),
  description: () => t('commands:copyVersion.description'),
  async handler({}) {
    const version = app.getVersion();
    await clipboard.writeText(version);
    notification(
      t('notifications:versionCopied.title'),
      t('notifications:versionCopied.body', { version }),
    );
  },
};
