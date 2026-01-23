export interface IMargins {
  l: number;
  r: number;
  t: number;
  b: number;
}

export type TPage = string;

export type TEntityType = 'commands' | 'desktops';

export interface IEntity {
  id: string;
  label: string;
  extra?: string;
}
