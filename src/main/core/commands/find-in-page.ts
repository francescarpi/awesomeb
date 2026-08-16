import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'find-in-page';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.findInPage.name',
  description: 'commands.findInPage.description',
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.startFindInPage();
    }
  },
};
