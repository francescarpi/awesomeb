import { NavigationEntry } from 'electron';
import { TTabId } from '~/types';

export interface ISessionHistory {
  tabs: Record<TTabId, ISessionHistoryTab>;
}

export interface ISessionHistoryTab {
  index: number;
  entries: NavigationEntry[];
}
