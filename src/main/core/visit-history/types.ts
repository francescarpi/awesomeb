import type { TransitionType, IHistoryItem } from './schemes';
export type { IVisitItem, IHistoryItem, IVisitHistory } from './schemes';

export type TFindUrlResult = { value: string; range: Array<[number, number]> };

export interface AddUrlDetails {
  url: string;
  title?: string;
  transition?: TransitionType;
  referringVisitId?: string;
  isLocal?: boolean;
}

export interface SearchQuery {
  text?: string;
  startTime?: number;
  endTime?: number;
  maxResults?: number;
}

export interface GetVisitsDetails {
  url: string;
}

export interface DeleteUrlDetails {
  url: string;
}

export interface DeleteRange {
  startTime: number;
  endTime: number;
}

export interface IVisitHistoryPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export interface IVisitHistoryResponse {
  items: IHistoryItem[];
  pagination: IVisitHistoryPagination;
}
