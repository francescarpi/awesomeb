import type { TPartitionId, TSearchEngineCode } from '~/types';

export interface IOpenUrlProps {
  partitionId?: TPartitionId;
  searchEngineCode?: TSearchEngineCode;
  targetId?: string;
  selectTab?: boolean;
}

export interface IMoveTabProps {
  selectTab?: boolean;
}
