import Store from 'electron-store';
import { userDataPath } from '@/paths';
import { MAX_CLOSED_TABS } from './constants';
import { ClosedTabsScheme, type IClosedTab, type IClosedTabs } from './schemes';
import { validateStore } from '@/core/validation';

export class ClosedTabs extends Store<IClosedTabs> {
  constructor() {
    const defaults: IClosedTabs = {
      tabs: [],
    };

    // Validate defaults before passing to electron-store
    ClosedTabsScheme.parse(defaults);

    super({
      name: 'closed-tabs',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk, fall back to defaults if corrupted
    this.store = validateStore(ClosedTabsScheme, this.store, 'ClosedTabs', defaults);
  }

  addTab(title: string, url: string) {
    const tabs = this.get('tabs');

    // Avoid adding duplicate entries for the same URL if it was closed multiple times
    if (tabs.some((tab) => tab.url === url)) {
      return;
    }

    const updatedTabs = [
      {
        title,
        url,
        timestamp: Date.now(),
      },
      ...tabs,
    ];

    // Validate before persisting
    ClosedTabsScheme.parse({ tabs: updatedTabs.slice(0, MAX_CLOSED_TABS) });
    this.set('tabs', updatedTabs.slice(0, MAX_CLOSED_TABS));
  }

  get mostRecentTab(): IClosedTab | null {
    // Validate the full store on read
    ClosedTabsScheme.parse(this.store);
    const tabs = this.get('tabs');
    return tabs.length > 0 ? tabs[0] : null;
  }

  get tabs(): IClosedTab[] {
    // Validate the full store on read
    ClosedTabsScheme.parse(this.store);
    return this.get('tabs');
  }

  clear() {
    // Validate before persisting
    ClosedTabsScheme.parse({ tabs: [] });
    this.set('tabs', []);
  }
}
