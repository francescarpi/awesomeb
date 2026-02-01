import { Browser, Window, Desktop } from '@/core';
import { UIPageView } from '@/ui';
import log from 'electron-log';
import { ITheme, IURLTabData } from '~/types';

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

  refreshURLBar(window: Window) {
    const urlbar = window.getChild<UIPageView>('urlbar')!;
    const data: IURLTabData = {
      safe: true,
      url: '',
      loading: false,
      tabId: -1,
    };

    const desktop = window.selectedDesktop;
    const tabContainer = desktop.selectedTabContainer;
    if (!tabContainer) {
      urlbar.send('urlbar:refresh', data);
      return;
    }

    const tab = tabContainer.selectedTab;
    if (!tab) {
      urlbar.send('urlbar:refresh', data);
      return;
    }

    data.safe = true; // TODO implement safe check
    data.url = tab.url || '';
    data.loading = tab.loading;
    data.tabId = tab.id;

    urlbar.send('urlbar:refresh', data);
  }
}
