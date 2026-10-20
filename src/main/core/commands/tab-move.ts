import { TTabId } from '~/types';
import { TabContainer } from '@/core';
import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {
  targetId: string;
  tabId: TTabId;
  /**
   * Only used when `targetId === 'move-as-child'`. The destination tab
   * container under which a new child will be created to host the tab.
   */
  parentTabContainer?: TabContainer;
}

export const TRIGGER = 'move-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:moveTab.name'),
  description: () => t('commands:moveTab.description'),
  modal: {
    page: 'move-tab',
  },
  visible: ({ window }) => !!window,
  async handler({ params, browser }) {
    await browser.moveTab(params.tabId, params.targetId, {
      selectTab: true,
      parentTabContainer: params.parentTabContainer,
    });
  },
};
