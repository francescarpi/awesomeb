import { Sidebar } from '@/ui';
import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'devtools-sidebar';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Devtools Sidebar',
  description: 'Show the sidebar devtools',
  visibility: ({}) => Boolean(process.env.ELECTRON_RENDERER_URL),
  async handler({ window }) {
    if (window) {
      const view = window.getView<Sidebar>('sidebar')!;
      view.webContents.openDevTools({ mode: 'detach', activate: false });
    }
  },
};
