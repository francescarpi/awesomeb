import { ICommand } from './types';
import type { TTabContainerId } from '~/types';
import log from 'electron-log';
import { getTabContainer } from './helpers';

const scopeLog = log.scope('ToggleCollapseChildren');

export interface ICommandParams {
  tabContainerId?: TTabContainerId;
}

export const TRIGGER = 'toggle-collapse-children';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.toggleCollapseChildren.name',
  description: 'commands.toggleCollapseChildren.description',
  visibility: ({ tab, tabContainer }) => !!tab && !!tabContainer && tabContainer.parent === null,
  async handler({ tabContainer, params, window }) {
    const targetTabContainer = getTabContainer(window, tabContainer, params?.tabContainerId);
    if (!targetTabContainer) {
      scopeLog.warn('No tab container available');
      return;
    }

    targetTabContainer.toggleChildrenCollapsed();
  },
};
