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
  async handler({ window, desktop, params, tabContainer: selectedTabContainer }) {
    const tabContainers = desktop.tabContainers;
    if (tabContainers.length === 0) {
      scopeLog.warn('No tab containers available to select.');
      return;
    }

    const tabContainer = tabContainers[params.index - 1];
    if (!tabContainer) {
      return;
    }

    if (tabContainer.id === selectedTabContainer?.id) {
      const lastTab = window.getLastAccessedTab({
        desktop,
        ignore: tabContainer.tabs.map((t) => t.id),
      });

      if (lastTab) {
        window.selectTab(lastTab.tab.id);
        return;
      }
    }

    if (tabContainer.selectedTab) {
      await window.selectTab(tabContainer.selectedTab.id);
    } else {
      await window.selectTab(tabContainer.tabs[0].id);
    }
  },
};
