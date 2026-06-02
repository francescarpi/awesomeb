import { ICommand } from './types';
import { notification } from '@/core';

export interface ICommandParams {}

export const TRIGGER = 'clear-closed-tabs';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Clear Closed Tabs',
  description: 'Clear the list of recently closed tabs',
  modal: {
    page: 'clear-closed-tabs',
  },
  visibility: ({ browser }) => browser.hasClosedTabs,
  async handler({ browser }) {
    for (const tab of browser.closedTabs) {
      browser.permanentlyCloseTab(tab.desktop, tab.tabContainer, tab.tab.id);
    }
    notification('Closed tabs cleared', 'The list of recently closed tabs has been cleared.');
  },
};
