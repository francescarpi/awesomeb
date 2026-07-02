import { expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions, windowOpenHadler } from '@/core';
import type { HandlerDetails } from 'electron';

function makeDetails(
  url: string,
  disposition: HandlerDetails['disposition'],
  features = '',
): HandlerDetails {
  return { url, disposition, features } as unknown as HandlerDetails;
}

describe('windowOpenHadler (dispatcher)', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });
  });

  test('popup (new-window with width): no new tab created (handler returns allow)', async () => {
    await browser.openURL('http://example.com');
    const before = browser.tabs.length;

    windowOpenHadler(
      browser,
      makeDetails('http://popup.example.com', 'new-window', 'width=400,height=300'),
    );

    expect(browser.tabs.length).toBe(before);
  });

  test('foreground-tab: creates a new tab in current desktop and selects it', async () => {
    await browser.openURL('http://jira.com');
    const before = browser.tabs.length;

    windowOpenHadler(browser, makeDetails('http://ticket.com', 'foreground-tab'));

    const after = browser.tabs.length;
    expect(after).toBe(before + 1);
    const newTab = browser.tabs[after - 1].tab;
    expect(newTab.url).toBe('http://ticket.com/');
    const activeTabId = browser.activeWindow!.selectedDesktop.selectedTabContainer?.selectedTab?.id;
    expect(activeTabId).toBe(newTab.id);
  });

  test('background-tab: creates a new tab in current desktop, does not select it', async () => {
    const jira = (await browser.openURL('http://jira.com'))!;
    await browser.activeWindow!.selectTab(jira.tab.id);
    const before = browser.tabs.length;

    windowOpenHadler(browser, makeDetails('http://ticket.com', 'background-tab'));

    const after = browser.tabs.length;
    expect(after).toBe(before + 1);
    const newTab = browser.tabs[after - 1].tab;
    expect(newTab.url).toBe('http://ticket.com/');
    const activeTabId = browser.activeWindow!.selectedDesktop.selectedTabContainer?.selectedTab?.id;
    expect(activeTabId).toBe(jira.tab.id);
  });

  test('new-window: creates a new tab in a new window', async () => {
    await browser.openURL('http://jira.com');
    const beforeWindows = browser.windows.length;

    windowOpenHadler(browser, makeDetails('http://ticket.com', 'new-window'));

    expect(browser.windows.length).toBe(beforeWindows + 1);
  });

  test('skipParent option is accepted without error', async () => {
    const before = browser.tabs.length;

    windowOpenHadler(browser, makeDetails('http://ticket.com', 'foreground-tab'), {
      skipParent: true,
    });

    expect(browser.tabs.length).toBe(before + 1);
  });
});
