import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'close-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:closeWindow.name'),
  description: () => t('commands:closeWindow.description'),
  visibility: ({ window }) => !!window,
  async handler({ window }) {
    window.bw.close();
  },
};
