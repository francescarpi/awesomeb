import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'zoom-in';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:zoomIn.name'),
  description: () => t('commands:zoomIn.description'),
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.setZoom('in');
    }
  },
};
