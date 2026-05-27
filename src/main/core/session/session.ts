import Store from 'electron-store';
import { userDataPath } from '@/paths';
import { SessionStoreScheme, type ISessionStore, type ISessionWindow } from './schemes';
import { Browser } from '@/core';
import log from 'electron-log';

const scopeLog = log.scope('Session');

export class Session extends Store<ISessionStore> {
  constructor(private readonly _browser: Browser) {
    const defaults: ISessionStore = {
      windows: [],
    };

    // Validate defaults before passing to electron-store
    SessionStoreScheme.parse(defaults);

    super({
      name: 'session',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk
    SessionStoreScheme.parse(this.store);
  }

  get windows(): ISessionWindow[] {
    // Validate the full store on read
    SessionStoreScheme.parse(this.store);
    return this.get('windows');
  }

  async save() {
    scopeLog.info('Saving session...');
    const data = this.sessionToStore();
    // Validate before persisting
    SessionStoreScheme.parse({ windows: data });
    this.set('windows', data);
  }

  sessionToStore(): ISessionWindow[] {
    const windows = this._browser.windows;
    const data = windows.map((window) => ({
      id: window.id,
      bounds: window.bounds,
      selectedDesktopId: window.selectedDesktop.id,
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

    // Validate before returning
    SessionStoreScheme.parse({ windows: data });
    return data;
  }
}
