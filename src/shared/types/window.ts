import { Rectangle } from 'electron';

export type TWindowId = number;

export interface ILayoutData {
  sidebarCollapsed: boolean;
  areaMaximized: boolean;
  hasVisibleTabs: boolean;
  selectedTabBounds: Rectangle | null;
}
