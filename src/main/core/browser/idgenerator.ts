import { Browser, TabContainer } from '@/core';
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
    this._forEachTabContainer((tc) => {
      if (tc.id > maxId) {
        maxId = tc.id;
      }
    });
    return (maxId + 1) as TTabContainerId;
  }

  get nextTabId(): TTabId {
    let maxId = 0;
    this._forEachTabContainer((tc) => {
      for (const tab of tc.tabs) {
        if (tab.id > maxId) {
          maxId = tab.id;
        }
        const preview = tab.tabPreview;
        if (preview && preview.tab.id > maxId) {
          maxId = preview.tab.id;
        }
      }
    });
    return (maxId + 1) as TTabId;
  }

  private _forEachTabContainer(callback: (tc: TabContainer) => void): void {
    for (const window of this._browser.windows.values()) {
      for (const desktop of window.desktops) {
        for (const tabContainer of desktop.tabContainers) {
          this._walkTabContainer(tabContainer, callback);
        }
      }
    }
  }

  private _walkTabContainer(tc: TabContainer, callback: (tc: TabContainer) => void): void {
    callback(tc);
    for (const child of tc.children) {
      this._walkTabContainer(child, callback);
    }
  }
}
