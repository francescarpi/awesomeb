import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'devtools';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.devtools.name',
  description: 'commands.devtools.description',
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.webContents.openDevTools();
    }
  },
};
