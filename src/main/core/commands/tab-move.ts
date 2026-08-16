import { TTabId } from '~/types';
import { ICommand } from './types';

export interface ICommandParams {
  targetId: string;
  tabId: TTabId;
}

export const TRIGGER = 'move-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.moveTab.name',
  description: 'commands.moveTab.description',
  modal: {
    page: 'move-tab',
  },
  visibility: ({ window }) => !!window,
  async handler({ params, browser }) {
    await browser.moveTab(params.tabId, params.targetId, { selectTab: true });
  },
};
