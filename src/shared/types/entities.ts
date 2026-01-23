export type TEntityType = 'commands' | 'desktops';

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
