export type TEntityType = 'commands' | 'desktops';

export interface IEntity {
  id: string;
  label: string;
  extra?: string;
}

export interface IDesktopEntity extends IEntity {
  selected: boolean;
  name: string | null;
  requireAttention: boolean;
  hasTabs: boolean;
  hasActiveTabs: boolean;
}
