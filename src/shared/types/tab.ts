import { TDesktopId } from './desktop';
import { TWindowId } from './window';

export type TTabId = number;
export type TTabContainerId = number;

export interface ITabContainer {
  id: TTabContainerId;
  selected: boolean;
  divider: boolean;
  tabs: ITab[];
}

export interface ITab {
  id: TTabId;
  desktopId: TDesktopId;
  windowId: TWindowId;
  title: string;
  url: string | null;
  selected: boolean;
  partition: ITabPartition;
  suspended: boolean;
  loading: boolean;
  favicon: string | null;
  hasTabPreview: boolean;
  requireAttention: boolean;
}

export interface ITabPartition {
  name: string;
  color: string;
  private: boolean;
}
