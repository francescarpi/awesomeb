import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'find-in-page';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Find in page',
  description: 'Find text in the current page',
  visibility: ({ tab }) => !!tab,
  async handler({ tab }) {
    if (tab) {
      tab.startFindInPage();
    }
  },
};
