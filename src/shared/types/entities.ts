export type TEntityType =
  | 'commands'
  | 'desktops'
  | 'themes'
  | 'searchEngines'
  | 'partitions'
  | 'targets'
  | 'tabs'
  | 'tabContainers'
  | 'bookmarks'
  | 'closedTabs';

export interface IEntity {
  id: string;
  label: string;
  selected?: boolean;
  extra?: string;
  isDimmed?: boolean;
}

export interface IDesktopEntity extends IEntity {
  name: string | null;
  requireAttention: boolean;
  hasTabs: boolean;
  hasActiveTabs: boolean;
}

export interface IThemeEntity extends IEntity {
  primary: string;
  secondary: string;
  degrees: number;
}

export interface IPartitionEntity extends IEntity {
  color: string;
}

export interface ITabEntity extends IEntity {
  url: string | null;
  partitionId: string;
  lastAccessed: number;
  partitionColor: string;
  suspended: boolean;
}

export interface ITabContainerEntity extends IEntity {}

export interface IBookmarkEntity extends IEntity {}
