import type { Browser, Window } from '@/core';
import type { ITab, TTabId } from '~/types';
import type { IAutomationTab } from './types';

/**
 * Helpers for the automation API.
 */

/**
 * Whether a renderer URL belongs to the app's main window page, as opposed to a
 * content tab or one of the auxiliary pages (tab switcher, tab marks).
 */
export function isWindowPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname === '/window';
  } catch {
    return false;
  }
}

/**
 * Every tab of the given window, normalized for automation consumers.
 */
export function listAutomationTabs(browser: Browser, win: Window): IAutomationTab[] {
  return browser.renderer.tabContainers(win).flatMap((tc) => tc.tabs.map(fromEntityTab));
}

/**
 * A single tab of the given window, or null when it does not exist.
 */
export function findAutomationTab(
  browser: Browser,
  win: Window,
  tabId: TTabId,
): IAutomationTab | null {
  return listAutomationTabs(browser, win).find((tab) => tab.id === tabId) ?? null;
}

function fromEntityTab(tab: ITab): IAutomationTab {
  return {
    id: tab.id,
    title: tab.title,
    url: tab.url,
    suspended: tab.suspended,
    selected: tab.selected,
    isInternal: tab.isInternal,
    desktopId: tab.desktopId,
  };
}
