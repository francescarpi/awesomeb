export type TEntityType =
  | 'commands'
  | 'desktops'
  | 'themes'
  | 'searchEngines'
  | 'partitions'
  | 'targets';

export interface IEntity {
  id: string;
  label: string;
  selected?: boolean;
  extra?: string;
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
