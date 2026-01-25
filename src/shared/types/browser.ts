import { Window, Desktop, TabContainer, Tab } from '@/core';

export interface ITarget {
  window: Window;
  desktop: Desktop;
  tabContainer: TabContainer;
}

export interface IWinDesConTab {
  window: Window;
  desktop: Desktop;
  tabContainer: TabContainer;
  tab: Tab;
}
