import { Browser } from '@/core';
import { TTabContainerId, TTabId, TWindowId } from '~/types';

export class IdGenerator {
  constructor(private readonly _browser: Browser) {}

  get nextWindowId(): TWindowId {
    let maxId = 0;
    for (const window of this._browser.windows.values()) {
      if (window.id > maxId) {
        maxId = window.id;
      }
    }
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
    let maxId = 0;
    for (const window of this._browser.windows.values()) {
      for (const desktop of window.desktops) {
        for (const tabContainer of desktop.tabContainers) {
          for (const tab of tabContainer.tabs) {
            if (tab.id > maxId) {
              maxId = tab.id;
            }
          }
        }
      }
    }
    return (maxId + 1) as TTabId;
  }
}
