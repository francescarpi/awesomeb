import type {
  ITheme,
  ILayoutData,
  IURLTabData,
  IExtension,
  IAppUpdaterInfo,
  IDesktop,
} from '~/types';

export interface IWindowState extends ILayoutData {
  theme: ITheme;
  shortcuts: string[];
  extensions: IExtension[];
  urlbar: IURLTabData;
  version: IAppUpdaterInfo | null;
  desktops: IDesktop[];
}

export interface IWindowBounds {
  sidebar: string;
  urlbar: string;
  main: string;
}
