import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'previous-visited-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:previousVisitedTab.name'),
  description: () => t('commands:previousVisitedTab.description'),
  visibility: ({ tab }) => !!tab,
  async handler({ window, tab }) {
    if (!tab) return;

    const lastVisited = window.getLastAccessedTab({ ignore: [tab.id] });
    if (!lastVisited) return;

    window.selectTab(lastVisited.tab.id);
  },
};
