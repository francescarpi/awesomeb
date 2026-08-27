import { ICommand } from './types';
import { notification } from '@/core';
import { t } from '~/i18n';

export interface ICommandParams {}

export const TRIGGER = 'clear-closed-tabs';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:clearClosedTabs.name'),
  description: () => t('commands:clearClosedTabs.description'),
  modal: {
    page: 'clear-closed-tabs',
  },
  visibility: ({ browser }) => browser.hasClosedTabs,
  async handler({ browser }) {
    for (const tab of browser.closedTabs) {
      browser.permanentlyCloseTab(tab.desktop, tab.tabContainer, tab.tab.id);
    }
    notification(
      t('notifications:closedTabsCleared.title'),
      t('notifications:closedTabsCleared.body'),
    );
  },
};
