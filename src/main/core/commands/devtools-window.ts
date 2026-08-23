import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'devtools-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:devtoolsWindow.name'),
  description: () => t('commands:devtoolsWindow.description'),
  visibility: ({}) => Boolean(process.env.ELECTRON_RENDERER_URL),
  async handler({ window }) {
    if (window) {
      window.webContents.openDevTools({ mode: 'detach', activate: false });
    }
  },
};
