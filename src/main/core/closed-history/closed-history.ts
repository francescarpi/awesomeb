import Store from 'electron-store';
import { userDataPath } from '@/paths';
import { MAX_CLOSED_TABS } from './constants';
import { ClosedHistoryScheme, type IClosedTab, type IClosedHistory } from './schemes';

export class ClosedHistory extends Store<IClosedHistory> {
  constructor() {
    const defaults: IClosedHistory = {
      tabs: [],
    };

    // Validate defaults before passing to electron-store
    ClosedHistoryScheme.parse(defaults);

    super({
      name: 'closed-history',
      cwd: userDataPath(),
      defaults,
    });

    // Validate what electron-store loaded from disk
    ClosedHistoryScheme.parse(this.store);
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
    ClosedHistoryScheme.parse({ tabs: updatedTabs.slice(0, MAX_CLOSED_TABS) });
    this.set('tabs', updatedTabs.slice(0, MAX_CLOSED_TABS));
  }

  get mostRecentTab(): IClosedTab | null {
    // Validate the full store on read
    ClosedHistoryScheme.parse(this.store);
    const tabs = this.get('tabs');
    return tabs.length > 0 ? tabs[0] : null;
  }

  get tabs(): IClosedTab[] {
    // Validate the full store on read
    ClosedHistoryScheme.parse(this.store);
    return this.get('tabs');
  }

  clear() {
    // Validate before persisting
    ClosedHistoryScheme.parse({ tabs: [] });
    this.set('tabs', []);
  }
}
