import Store from 'electron-store';
import { userDataPath } from '@/paths';
import {
  SessionStoreScheme,
  type ISessionStore,
  type ISessionWindow,
  type ISessionTabContainer,
} from './schemes';
import { Browser, TabContainer } from '@/core';
import { validateStore } from '@/core/validation';
import log from 'electron-log';

const scopeLog = log.scope('Session');

function hasPersistedTabs(tc: TabContainer): boolean {
  const hasOwnNonPrivateTab = tc.tabs.some((tab) => !tab.partition.private);
  const hasPersistableChild = tc.children.some(hasPersistedTabs);
  return hasOwnNonPrivateTab || hasPersistableChild;
}

function serializeTabContainer(tc: TabContainer): ISessionTabContainer {
  return {
    id: tc.id,
    divider: tc.divider,
    childrenCollapsed: tc.childrenCollapsed,
    tabs: tc.tabs
      .filter((tab) => !tab.partition.private)
      .map((tab) => ({
        id: tab.id,
        partitionId: tab.partition.id,
        title: tab.title,
        customTitle: tab.customTitle,
        url: tab.url,
        favicon: tab.favicon,
        closedAt: tab.closedAt,
        openTabsAsChild: tab.openTabsAsChild,
      })),
    children: tc.children.filter(hasPersistedTabs).map(serializeTabContainer),
  };
}

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

    // Validate what electron-store loaded from disk, fall back to defaults if corrupted
    this.store = validateStore(SessionStoreScheme, this.store, 'Session', defaults);
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
      desktops: window.desktops.map((desktop) => ({
        id: desktop.id,
        shortName: desktop.shortName,
        longName: desktop.longName,
        theme: desktop.theme.name,
        tabContainers: desktop.tabContainers.filter(hasPersistedTabs).map(serializeTabContainer),
      })),
    }));

    // Validate before returning
    SessionStoreScheme.parse({ windows: data });
    return data;
  }
}
