import type { ITheme, ILayoutData, IURLTabData, IExtension } from '~/types';

export interface IWindowState extends ILayoutData {
  theme: ITheme;
  shortcuts: string[];
  extensions: IExtension[];
  urlbar: IURLTabData;
}
