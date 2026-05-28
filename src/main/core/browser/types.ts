import type { TPartitionId, TSearchEngineCode, TTabContainerId } from '~/types';

export interface IOpenUrlProps {
  partitionId?: TPartitionId;
  searchEngineCode?: TSearchEngineCode;
  targetId?: string;
  selectTab?: boolean;
  afterTabContainerId?: TTabContainerId;
}

export interface IMoveTabProps {
  selectTab?: boolean;
}
