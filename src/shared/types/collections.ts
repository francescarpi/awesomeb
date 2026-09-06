import { type TTabId } from './tab';

export interface ICreateCollection {
  tabs: TTabId[];
  createCollection: boolean;
  value: string;
  closeTabs: boolean;
}
