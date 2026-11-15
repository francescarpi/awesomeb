import { Rectangle } from 'electron';

export type TWindowId = number;

export interface ILayoutData {
  sidebarCollapsed: boolean;
  areaMaximized: boolean;
  hasVisibleTabs: boolean;
  selectedTabBounds: Rectangle | null;
  selectedTabPartitionColor: string | null;
  sidebarWidth: number;
  // True when the layout change was animated in the main process. The renderer
  // uses it to hide the selected-tab overlay while the view is sliding, since
  // it only receives the final bounds.
  animated: boolean;
}
