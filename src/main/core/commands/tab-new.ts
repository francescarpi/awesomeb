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
  modal: {
    page: 'new-tab',
    props: {
      height: 600,
    },
  },
  visibility: ({ window }) => !!window,
  async handler({ browser, params, window }) {
    window.modal.close();

    await browser.openURL(params.query, {
      partitionId: params.partitionId,
      searchEngineCode: params.searchEngineCode,
      targetId: params.targetId,
    });
  },
};
