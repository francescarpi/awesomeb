import type { ITheme, ILayoutData, IURLTabData, IExtension, IAppUpdaterInfo } from '~/types';

export interface IWindowState extends ILayoutData {
  theme: ITheme;
  shortcuts: string[];
  extensions: IExtension[];
  urlbar: IURLTabData;
  version: IAppUpdaterInfo | null;
}

export interface IWindowBounds {
  sidebar: string;
  urlbar: string;
  main: string;
}
