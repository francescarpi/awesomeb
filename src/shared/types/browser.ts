import { Window, Desktop, TabContainer, Tab, Partition } from '@/core';

export interface ITarget {
  window: Window;
  desktop: Desktop;
  tabContainer: TabContainer;
  partition: Partition;
}

export interface IWinDesConTab {
  window: Window;
  desktop: Desktop;
  tabContainer: TabContainer;
  tab: Tab;
}
