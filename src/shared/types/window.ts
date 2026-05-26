import { Rectangle } from 'electron';
import { TTabId } from './tab';

export type TWindowId = number;

export interface ILayoutData {
  sidebarCollapsed: boolean;
  areaMaximized: boolean;
  hasVisibleTabs: boolean;
  selectedTabBounds: Rectangle | null;
  selectedTabPartitionColor: string | null;
}

export interface IMediaSessionInfo {
  title: string;
  album: string;
  artist: string;
  state: 'none' | 'paused' | 'playing';
  volume: number;
}

export interface ITabMediaSessionInfo extends IMediaSessionInfo {
  tabId: TTabId;
  tabTitle: string;
  favicon: string | null;
}

export type TMediaSessionAction = 'play' | 'pause' | 'mute' | 'unmute';
