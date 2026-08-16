import { TPartitionId, TTabId } from '~/types';
import { ICommand } from './types';

export interface ICommandParams {
  tabId: TTabId;
  targetId: string;
  partitionId?: TPartitionId;
}

export const TRIGGER = 'duplicate-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'commands.duplicateTab.name',
  description: 'commands.duplicateTab.description',
  modal: {
    page: 'duplicate-tab',
  },
  visibility: ({ tab }) => !!tab,
  async handler({ browser, params }) {
    browser.duplicateTab(params.tabId, {
      partitionId: params.partitionId,
      targetId: params.targetId,
      selectTab: true,
    });
  },
};
