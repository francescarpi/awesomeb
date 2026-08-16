import { ICommand } from './types';
import { TabSwitcher } from '@/ui';

export interface ICommandParams {}

export const TRIGGER = 'devtools-tabswitcher';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.devtoolsTabswitcher.name',
  description: 'commands.devtoolsTabswitcher.description',
  visibility: ({}) => Boolean(process.env.ELECTRON_RENDERER_URL),
  async handler({ window }) {
    if (window) {
      const view = window.getView<TabSwitcher>('tab-switcher')!;
      view.webContents.openDevTools({ mode: 'detach', activate: false });
    }
  },
};
