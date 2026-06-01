import { Browser } from '@/core';
import { TTabContainerId, TTabId, TWindowId } from '~/types';

export class IdGenerator {
  constructor(private readonly _browser: Browser) {}

  get nextWindowId(): TWindowId {
    const winIds = this._browser.windows.values().map((window) => window.id);
    const maxId = Math.max(0, ...winIds);
    return (maxId + 1) as TWindowId;
  }

  get nextTabContainerId(): TTabContainerId {
    let maxId = 0;
    for (const window of this._browser.windows.values()) {
      for (const desktop of window.desktops) {
        for (const tabContainer of desktop.tabContainers) {
          if (tabContainer.id > maxId) {
            maxId = tabContainer.id;
          }
        }
      }
    }
    return (maxId + 1) as TTabContainerId;
  }

  get nextTabId(): TTabId {
    const tabIds: number[] = [];
    for (const window of this._browser.windows.values()) {
      for (const desktop of window.desktops) {
        for (const tabContainer of desktop.tabContainers) {
          for (const tab of tabContainer.tabs) {
            tabIds.push(tab.id);
            if (tab.tabPreview) {
              tabIds.push(tab.tabPreview.tab.id);
            }
          }
        }
      }
    }

    const maxId = Math.max(0, ...tabIds);
    return (maxId + 1) as TTabId;
  }
}
