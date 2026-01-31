import { TPartitionId, TSearchEngineCode } from '~/types';
import { ICommand } from './types';

export interface ICommandParams {
  query: string;
  partitionId: TPartitionId;
  searchEngineCode: TSearchEngineCode;
  targetId: string;
}

export const TRIGGER = 'new-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'New Tab',
  description: 'Open a new tab in specified target',
  visibility: ({ focusedWindow }) => !!focusedWindow,
  async handler({ browser, params }) {
    const result = browser.openURL(params.query, {
      partitionId: params.partitionId,
      searchEngineCode: params.searchEngineCode,
      targetId: params.targetId,
    });

    if (result) {
      const { tab, window } = result;
      await window.selectTab(tab.id);
    }
  },
};
