import type { TPartitionId, TSearchEngineCode, TTabContainerId } from '~/types';
import { TabContainer } from '@/core';

export interface IOpenUrlProps {
  partitionId?: TPartitionId;
  searchEngineCode?: TSearchEngineCode;
  targetId?: string;
  selectTab?: boolean;
  parentTabContainer?: TabContainer;
  activeTabContainerId?: TTabContainerId;
}

export interface IMoveTabProps {
  selectTab?: boolean;
  /**
   * Destination parent tab container for `'move-as-child'` targetId.
   * When provided, the moved tab is placed inside a brand-new child of the
   * given container instead of being moved at the top level of the target.
   */
  parentTabContainer?: TabContainer;
}
