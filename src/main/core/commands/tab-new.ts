import { TPartitionId, TSearchEngineCode } from '~/types';
import { ICommand } from './types';
import { t } from '~/i18n';

export interface ICommandParams {
  query: string;
  partitionId: TPartitionId;
  searchEngineCode: TSearchEngineCode;
  targetId: string;
}

export const TRIGGER = 'new-tab';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: () => t('commands:newTab.name'),
  description: () => t('commands:newTab.description'),
  modal: {
    page: 'new-tab',
  },
  visibility: ({ window }) => !!window,
  async handler({ browser, params, window }) {
    window.modal.close();

    await browser.openURL(params.query, {
      partitionId: params.partitionId,
      searchEngineCode: params.searchEngineCode,
      targetId: params.targetId,
      selectTab: true,
    });
  },
};
