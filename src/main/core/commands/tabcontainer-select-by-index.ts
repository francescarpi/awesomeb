import { ICommand } from './types';

export interface ICommandParams {
  index: number;
}

export const TRIGGER = 'select-tabcontainer-by-index';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Select Tab Container by Index',
  description: 'Selects a tab container based on the provided index, being one-based.',
  visibility: ({ window }) => !!window,
  async handler({ window, desktop, params }) {
    const tabContainers = desktop.tabContainers;
    const result = tabContainers[params.index - 1];
    if (result && result.selectedTab) {
      await window.selectTab(result.selectedTab.id);
    }
  },
};
