import type { Result } from 'electron';

export type TFindInPageId = number;

export type TFindInPageAction = 'start' | 'next' | 'previous';

export interface IFindInPageSearch {
  requestId: TFindInPageId;
  query: string;
  action: TFindInPageAction;
  result: Result | null;
}

export interface IFindInPageResult {
  requestId: number;
  query: string;
  activeMatch: number;
  matches: number;
}
