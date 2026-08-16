import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'devtools-window';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.devtoolsWindow.name',
  description: 'commands.devtoolsWindow.description',
  visibility: ({}) => Boolean(process.env.ELECTRON_RENDERER_URL),
  async handler({ window }) {
    if (window) {
      window.webContents.openDevTools({ mode: 'detach', activate: false });
    }
  },
};
