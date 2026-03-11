import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'devtools';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Open DevTools',
  description: 'Open the DevTools for the current tab.',
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.webContents.openDevTools();
    }
  },
};
