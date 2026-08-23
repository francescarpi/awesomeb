import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'devtools';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:devtools.name'),
  description: () => t('commands:devtools.description'),
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.webContents.openDevTools();
    }
  },
};
