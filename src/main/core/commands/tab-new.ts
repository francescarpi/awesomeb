import { TPartitionId, TSearchEngineCode } from '~/types';
import { ICommand } from './types';
// import log from 'electron-log';

// const scopeLog = log.scope('NewTabCommand');

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
  async handler(_browser, _window, params) {
    console.log(params);
  },
};
