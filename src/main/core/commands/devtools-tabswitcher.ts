import { ICommand } from './types';
import { TabSwitcher } from '@/ui';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'devtools-tabswitcher';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:devtoolsTabswitcher.name'),
  description: () => t('commands:devtoolsTabswitcher.description'),
  visibility: ({}) => Boolean(process.env.ELECTRON_RENDERER_URL),
  async handler({ window }) {
    if (window) {
      const view = window.getView<TabSwitcher>('tab-switcher')!;
      view.webContents.openDevTools({ mode: 'detach', activate: false });
    }
  },
};
