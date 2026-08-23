import { URLBar } from '@/ui';
import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'devtools-urlbar';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:devtoolsUrlbar.name'),
  description: () => t('commands:devtoolsUrlbar.description'),
  visibility: ({}) => Boolean(process.env.ELECTRON_RENDERER_URL),
  async handler({ window }) {
    if (window) {
      const view = window.getView<URLBar>('urlbar')!;
      view.webContents.openDevTools({ mode: 'detach', activate: false });
    }
  },
};
