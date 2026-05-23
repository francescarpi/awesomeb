import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'devtools-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Devtools Window',
  description: 'Show the main window devtools',
  visibility: ({}) => Boolean(process.env.VITE_DEV_SERVER_URL),
  async handler({ window }) {
    if (window) {
      window.webContents.openDevTools({ mode: 'detach', activate: false });
    }
  },
};
