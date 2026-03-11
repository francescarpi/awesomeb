import Store from 'electron-store';
import { IClosedHistory, IClosedTab } from './types';
import { userDataPath } from '@/paths';
import { MAX_CLOSED_TABS } from './constants';

export class ClosedHistory extends Store<IClosedHistory> {
  constructor() {
    super({
      name: 'closed-history',
      cwd: userDataPath(),
      defaults: {
        tabs: [],
      },
    });
  }

  addTab(title: string, url: string) {
    const tabs = this.get('tabs');

    // Avoid adding duplicate entries for the same URL if it was closed multiple times
    if (tabs.some((tab) => tab.url === url)) {
      return;
    }

    tabs.unshift({
      title,
      url,
      timestamp: Date.now(),
    });
    this.set('tabs', tabs.slice(0, MAX_CLOSED_TABS)); // Keep only the last MAX_CLOSED_TABS closed tabs
  }

  get mostRecentTab(): IClosedTab | null {
    const tabs = this.get('tabs');
    return tabs.length > 0 ? tabs[0] : null; // Return the most recently closed tab
  }

  get tabs(): IClosedTab[] {
    return this.get('tabs');
  }

  clear() {
    this.set('tabs', []);
  }
}
