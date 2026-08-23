import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'zoom-reset';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:zoomReset.name'),
  description: () => t('commands:zoomReset.description'),
  visibility: ({ tab }) => !!tab && tab.getZoomFactor() !== 1,
  async handler({ tab }) {
    if (tab) {
      tab.setZoom('reset');
    }
  },
};
