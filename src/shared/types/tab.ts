import { TDesktopId } from './desktop';
import { TWindowId } from './window';

export type TTabId = number;
export type TTabContainerId = number;

export interface ITabContainer {
  id: TTabContainerId;
  shortcut: number | null;
  selected: boolean;
  divider: boolean;
  tabs: ITab[];
  desktopId: TDesktopId;
  isClosed: boolean;
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
  hasTabPreview: boolean;
  requireAttention: boolean;
  isMuted: boolean;
  favicon: string | null;
  isClosed: boolean;
}

export interface ITabPartition {
  name: string;
  color: string;
  private: boolean;
}

export interface IURLTabData {
  safe: boolean;
  url: string;
  loading: boolean;
  tabId: TTabId;
}

export interface ITabNavigation {
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  hasURL: boolean;
  tabId: TTabId;
}

export interface ITabSwitcherTab {
  id: TTabId;
  title: string;
  partitionColor: string;
  desktopName: string | null;
}

export type TTabPreviewAction = 'close' | 'accept' | 'split';
