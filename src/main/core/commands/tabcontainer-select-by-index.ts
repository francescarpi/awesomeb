import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('SelectTabContainerByIndexCommand');

export interface ICommandParams {
  index: number;
}

export const TRIGGER = 'select-tabcontainer-by-index';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Select Tab Container by Index',
  description: 'Selects a tab container based on the provided index, being one-based.',
  visibility: ({ window }) => !!window,
  async handler({ window, desktop, params, tabContainer: selectedTabContainer, tab: selectedTab }) {
    const tabContainers = desktop.tabContainers;
    if (tabContainers.length === 0) {
      scopeLog.warn('No tab containers available to select.');
      return;
    }

    const result = tabContainers[params.index - 1];
    if (result && result.id === selectedTabContainer?.id && selectedTab) {
      const orderedTabs = window.tabsOrderedByLastAccessed;
      if (orderedTabs.length > 1) {
        const previous = orderedTabs[1];
        window.selectTab(previous.tab.id);
        return;
      }
    }

    if (result) {
      if (result.selectedTab) {
        await window.selectTab(result.selectedTab.id);
      } else {
        await window.selectTab(result.tabs[0].id);
      }
    } else {
      scopeLog.warn(
        `No tab container found at index ${params.index - 1}. Total containers: ${tabContainers.length}`,
      );
    }
  },
};
