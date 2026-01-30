import { Browser, Window, Desktop } from '@/core';
import { UIPageView } from '@/ui';
import log from 'electron-log';
import { ITheme } from '~/types';

const scopeLog = log.scope('BrowserRendererEmmiter');

export class BrowserRendererEmmiter {
  constructor(private readonly _browser: Browser) {}

  refreshDesktops(window: Window) {
    const sidebar = window.getChild<UIPageView>('sidebar')!;
    const desktops = this._browser.renderer.desktops(window);
    sidebar.send('desktops:refresh', desktops);
    scopeLog.info('Desktops refreshed in renderer');
  }

  refreshThemes(window: Window, desktop: Desktop) {
    const result: ITheme = {
      primary: desktop.theme.primary,
      secondary: desktop.theme.secondary,
      degrees: desktop.theme.degrees,
    };
    window.wc.send('desktop:theme-refresh', result);
  }

  refreshTabContainers(window: Window) {
    const sidebar = window.getChild<UIPageView>('sidebar')!;
    const tabContainers = this._browser.renderer.tabContainers(window);
    sidebar.send('tabs:refresh', tabContainers);
  }
}
