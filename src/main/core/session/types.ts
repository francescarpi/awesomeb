import { TDesktopId } from '@shared/types';
import { Rectangle } from 'electron';

export interface ISessionStore {
  windows: ISessionWindow[];
}

export interface ISessionWindow {
  bounds: Rectangle;
  selectedDesktopId: TDesktopId;
  sidebarCollapsed: boolean;
  areaMaximized: boolean;
  desktops: {
    id: TDesktopId;
    name: string | null;
    theme: string;
    //   tabContainers: {
    //     id: TTabContainerId;
    //     divider: boolean;
    //     layout: ETabContainerLayout;
    //     tabs: {
    //       id: TTabId;
    //       partitionId: TPartitionId;
    //       title: string | null;
    //       customTitle: string | null;
    //       url: string | null;
    //     }[];
    //   }[];
  }[];
}
