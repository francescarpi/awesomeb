import { TDesktopId } from '~/types';
import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {
  desktopId: TDesktopId;
}

export const TRIGGER = 'select-desktop';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:selectDesktop.name'),
  description: () => t('commands:selectDesktop.description'),
  modal: {
    page: 'select-desktop',
  },
  visibility: ({ window }) => !!window,
  async handler({ window, params }) {
    // TODO if desktopId is the selected one, back to previous desktop

    window.selectDesktop(params.desktopId);
  },
};
