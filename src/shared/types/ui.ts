export interface IMargins {
  l: number;
  r: number;
  t: number;
  b: number;
}

export type TPage = string;

export type TListWithSearchEntity = 'commands';

export interface IListWithSearchEntity {
  id: string;
  label: string;
  extra?: string;
}
