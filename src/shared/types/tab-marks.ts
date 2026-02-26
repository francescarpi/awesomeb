import { TTabId } from './tab';

export interface ITabMark {
  trigger: string;
  tabId: TTabId;
  title: string;
}

export type TMarksAction =
  | { id: 'deleteAll' }
  | { id: 'deleteOne' }
  | { id: 'add'; trigger: string }
  | { id: 'select'; trigger: string };
