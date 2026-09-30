import type {
  ITheme,
  ILayoutData,
  IURLTabData,
  IExtension,
  IAppUpdaterInfo,
  IDesktop,
  ITabContainer,
} from '~/types';

export interface IWindowState extends ILayoutData {
  theme: ITheme;
  shortcuts: string[];
  extensions: IExtension[];
  urlbar: IURLTabData;
  version: IAppUpdaterInfo | null;
  desktops: IDesktop[];
  tabContainers: ITabContainer[];
}

export interface IWindowBounds {
  sidebar: string;
  urlbar: string;
  main: string;
}
