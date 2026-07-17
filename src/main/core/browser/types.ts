import type { TPartitionId, TSearchEngineCode } from '~/types';
import { TabContainer } from '@/core';

export interface IOpenUrlProps {
  partitionId?: TPartitionId;
  searchEngineCode?: TSearchEngineCode;
  targetId?: string;
  selectTab?: boolean;
  parentTabContainer?: TabContainer;
}

export interface IMoveTabProps {
  selectTab?: boolean;
}
