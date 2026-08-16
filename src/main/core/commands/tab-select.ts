import { TTabId } from '~/types';
import { ICommand } from './types';

export interface ICommandParams {
  tabId: TTabId;
}

export const TRIGGER = 'select-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.selectTab.name',
  description: 'commands.selectTab.description',
  visibility: ({ tab }) => !!tab,
  async handler({ window, params }) {
    await window.selectTab(params.tabId);
    window.setWhoInitiateRequireAttention(null);
  },
};
