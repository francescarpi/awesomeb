import { type TTabContainerId } from '~/types';
import { ICommand } from './types';
import { getTabContainer } from './helpers';
import { t } from '~/i18n';

export interface ICommandParams {
  tabContainerId?: TTabContainerId;
}

export const TRIGGER = 'close-tab-children';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:closeTabChildren.name'),
  description: () => t('commands:closeTabChildren.description'),
  visible: ({ tabContainer }) => !!tabContainer && tabContainer.hasChildren,
  async handler({ browser, window, tabContainer, params }) {
    const target = getTabContainer(window, tabContainer, params?.tabContainerId);

    if (!target) {
      return;
    }

    const { selectedTab } = target;
    const promises: Promise<boolean>[] = [];

    for (const child of target.children) {
      if (child.isClosed) {
        continue;
      }

      for (const tab of child.tabs) {
        promises.push(browser.closeTab(tab.id, { emit: false }));
      }
    }

    await Promise.all(promises);

    browser.eventsChannel.emit('window:tab-did-close', window);

    if (selectedTab) {
      await window.selectTab(selectedTab.id);
    }
  },
};
