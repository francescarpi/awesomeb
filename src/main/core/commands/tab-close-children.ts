import { type TTabContainerId } from '~/types';
import { ICommand } from './types';
import { getTabContainer } from './helpers';

export interface ICommandParams {
  tabContainerId?: TTabContainerId;
}

export const TRIGGER = 'close-tab-children';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Close Children',
  description: 'Close all child tabs of the selected tab',
  visibility: ({ tabContainer }) => !!tabContainer && tabContainer.hasChildren,
  async handler({ browser, window, tabContainer, params }) {
    const target = getTabContainer(window, tabContainer, params?.tabContainerId);
    if (!target) return;
    for (const child of target.children) {
      if (child.isClosed) continue;
      for (const tab of child.tabs) {
        await browser.closeTab(tab.id);
      }
    }
  },
};
