import { ICommand } from './types';
import log from 'electron-log';

const scopeLog = log.scope('SelectTabContainerByIndexCommand');

export interface ICommandParams {
  index: number;
}

export const TRIGGER = 'select-tabcontainer-by-index';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.selectTabcontainerByIndex.name',
  description: 'commands.selectTabcontainerByIndex.description',
  visibility: ({ window }) => !!window,
  async handler({ window, desktop, params, tabContainer: selectedTabContainer }) {
    const tabContainer = desktop.getTabContainerByIndex(params.index - 1);
    if (!tabContainer) {
      scopeLog.warn(`No tab container found at index ${params.index}.`);
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
