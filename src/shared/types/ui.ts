export interface IMargins {
  l: number;
  r: number;
  t: number;
  b: number;
}

export type TPage = string;

export type TListWithSearchEntity = 'commands' | 'desktops';

export interface IListWithSearchEntity {
  id: string;
  label: string;
  extra?: string;
}
