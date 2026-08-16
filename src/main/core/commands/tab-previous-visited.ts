import { ICommand } from './types';

export interface ICommandParams {}

export const TRIGGER = 'previous-visited-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.previousVisitedTab.name',
  description: 'commands.previousVisitedTab.description',
  visibility: ({ tab }) => !!tab,
  async handler({ window, tab }) {
    if (!tab) return;

    const lastVisited = window.getLastAccessedTab({ ignore: [tab.id] });
    if (!lastVisited) return;

    window.selectTab(lastVisited.tab.id);
  },
};
