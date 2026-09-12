import { Browser, Window, Tab, config } from '@/core';
import { visitHistory } from './index';
import { INTERNAL_PROTOCOL } from '~/constants';
import { debounce } from '~/utils/debounce';
import type { TransitionType } from './schemes';

function shouldRecord(tab: Tab): boolean {
  if (tab.partition.private) return false;
  if (tab.isTabPreview) return false;
  if (!tab.url) return false;
  if (tab.url === 'about:blank') return false;
  if (tab.url.startsWith(`${INTERNAL_PROTOCOL}://`)) return false;
  return true;
}

function recordUrl(tab: Tab, transition: TransitionType) {
  visitHistory.addUrl({
    url: tab.url!,
    title: tab.rawTitle,
    transition,
  });

  const retentionDays = config.getProperty('historyRetentionDays');
  visitHistory.cleanupOldEntries(retentionDays);
}

// Collapse rapid navigation bursts (redirects, SPA route changes) into a
// single visit-history write per quiet period. Flushed on quit so the last
// pending visit is never lost.
const debouncedRecordUrl = debounce(recordUrl, 750);

export function flushVisitHistory(): void {
  debouncedRecordUrl.flush();
}

export function registerVisitHistoryHooks(browser: Browser) {
  // Hook 1: All URL changes (did-navigate, did-navigate-in-page)
  browser.eventsChannel.on('tab:url-did-change', (tab: Tab) => {
    if (!shouldRecord(tab)) return;
    debouncedRecordUrl(tab, 'link');
  });

  // Hook 2: User intentionally opened a new URL (new-tab, openURL, etc.)
  browser.eventsChannel.on('browser:url-opened', (window: Window) => {
    const tab = window.selectedTab?.tab;
    if (!tab || !shouldRecord(tab)) return;
    debouncedRecordUrl(tab, 'typed');
  });
}
