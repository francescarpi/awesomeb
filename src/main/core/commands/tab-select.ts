import { TTabId } from '~/types';
import { ICommand } from './types';

export interface ICommandParams {
  tabId: TTabId;
}

export const TRIGGER = 'select-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Select Tab',
  description: 'Selects a tab by its ID in the focused window.',
  visibility: ({ tab }) => !!tab,
  async handler({ window, params }) {
    await window.selectTab(params.tabId);
    window.setWhoInitiateRequireAttention(null);
  },
};
