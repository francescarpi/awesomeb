import Store from 'electron-store';
import { userDataPath } from '@/paths';
import type { ISessionStore, ISessionWindow } from './types';
import { Browser } from '@/core';
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
    const windows = this._browser.windows;
    return windows.map((window) => ({
      id: window.id,
      bounds: window.bounds,
      selectedDesktopId: window.selectedDesktop.id,
      visibleDesktopsRange: window.visibleDesktopsRange,
      sidebarCollapsed: window.sidebarCollapsed,
      areaMaximized: window.areaMaximized,
      desktops: window.desktops.map((desktop) => {
        const tabContainers = desktop.tabContainers
          .map((tabContainer) => ({
            id: tabContainer.id,
            divider: tabContainer.divider,
            // layout: tabContainer.layout,
            tabs: tabContainer.tabs
              .filter((tab) => !tab.partition.private)
              .map((tab) => ({
                id: tab.id,
                partitionId: tab.partition.id,
                title: tab.title,
                customTitle: tab.customTitle,
                url: tab.url,
                favicon: tab.favicon,
              })),
          }))
          .filter((tabContainer) => tabContainer.tabs.length > 0);

        return {
          id: desktop.id,
          name: desktop.name,
          theme: desktop.theme.name,
          tabContainers: tabContainers,
        };
      }),
    }));
  }
}
