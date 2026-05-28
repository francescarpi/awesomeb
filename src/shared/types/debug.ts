import type { TWindowId } from './window';
import type { TTabId, TTabContainerId } from './tab';
import type { TDesktopId } from './desktop';

export interface IDebugWebContent {
  winId: TWindowId;
  url: string;
  title: string;
  pid: number;
  visible: boolean;
  memory: string;
  memoryValue: number;
  cpu: string;
  cpuValue: number;
  preloads: { filePath: string; type: string }[];
  partition: {
    persistent: boolean;
    name: string;
  };
}

export interface IDebugTabIndex {
  indexTabId: TTabId;
  winId: TWindowId;
  desktopId: TDesktopId;
  tabContainerID: TTabContainerId;
  tab: {
    id: TTabId;
    title: string;
  };
}
