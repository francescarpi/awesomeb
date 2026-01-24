import Store from 'electron-store';
import { userDataPath } from '@main/paths';
import type { ISessionStore, ISessionWindow } from './types';
import { Browser, defaultTheme } from '@main/core';
import log from 'electron-log';

const scopeLog = log.scope('Session');

export class Session extends Store<ISessionStore> {
  constructor(private readonly _browser: Browser) {
    super({
      name: 'session',
      cwd: userDataPath(),
      defaults: {
        windows: [],
      },
    });
  }

  get windows(): ISessionWindow[] {
    return this.get('windows');
  }

  async save() {
    scopeLog.info('Saving session...');
    this.set('windows', this.sessionToStore());
  }

  sessionToStore(): ISessionWindow[] {
    return this._browser.windows.map((window) => ({
      bounds: window.bounds,
      selectedDesktopId: window.selectedDesktop.id,
      sidebarCollapsed: window.isSidebarCollapsed,
      areaMaximized: window.isAreaMaximized,
      desktops: window.desktops.map((desktop) => {
        // const tabContainers = desktop.tabContainers
        //   .map((tabContainer) => ({
        //     id: tabContainer.id,
        //     divider: tabContainer.divider,
        //     layout: tabContainer.layout,
        //     tabs: tabContainer.tabs
        //       .filter((tab) => !tab.partition.private)
        //       .map((tab) => ({
        //         id: tab.id,
        //         partitionId: tab.partition.id,
        //         title: tab.title,
        //         customTitle: tab.customTitle,
        //         url: tab.url,
        //       })),
        //   }))
        //   .filter((tabContainer) => tabContainer.tabs.length > 0);

        return {
          id: desktop.id,
          name: desktop.name,
          // theme: desktop.theme.name,
          theme: defaultTheme.name, // TODO Fix!!
          // tabContainers: tabContainers,
        };
      }),
    }));
  }
}
