import { expect, test, describe, vi } from 'vitest';
import { Browser } from '@/core';
import { MIN_DESKTOPS } from './constants';

test('recent created window should have MIN_DESKTOPS', () => {
  const browser = new Browser();
  const w = browser.createWindow();
  w.createDefaultDesktops();

  expect(w.desktops.length).toBe(MIN_DESKTOPS);

  for (let i = 0; i < MIN_DESKTOPS; i++) {
    expect(w.desktops[i].id).toBe(i + 1);
    expect(w.desktops[i].label).toBe(`${i + 1}: Unnamed`);
  }
});

test('go to next and previous desktop should work correctly', () => {
  const browser = new Browser();
  const w = browser.createWindow();
  w.createDefaultDesktops();

  expect(w.selectedDesktop.id).toBe(1);

  w.selectDesktop('prev');
  expect(w.selectedDesktop.id).toBe(5);

  w.selectDesktop('next');
  expect(w.selectedDesktop.id).toBe(1);

  w.selectDesktop(5);
  expect(w.selectedDesktop.id).toBe(5);

  w.selectDesktop('next');
  expect(w.selectedDesktop.id).toBe(1);
});

test('select tab should work correctly', async () => {
  const browser = new Browser();
  const w = browser.createWindow();
  w.createDefaultDesktops();

  expect(w.selectedDesktop.id).toBe(1);
  const desktop = w.selectDesktop(3);
  expect(w.selectedDesktop.id).toBe(3);
  expect(desktop).not.toBeNull();
  expect(desktop?.selectedTabContainer).toBeNull();

  const result = await browser.openURL('http://example.com');
  expect(result).not.toBeNull();

  const { tab, window, tabContainer } = result!;

  await window.selectTab(tab.id);

  expect(desktop!.selectedTabContainer).not.toBeNull();
  expect(desktop!.selectedTabContainer?.id).toBe(tabContainer.id);
  expect(desktop!.selectedTabContainer!.selectedTab).not.toBeNull();
  expect(desktop!.selectedTabContainer!.selectedTab!.id).toBe(tab.id);
});

describe('getAllTabs', () => {
  test('should return empty array when no tabs exist', () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const allTabs = w.getAllTabs();

    expect(allTabs).toEqual([]);
    expect(allTabs.length).toBe(0);
  });

  test('should return all tabs from a single desktop', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    // Open multiple tabs on desktop 1
    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    const allTabs = w.getAllTabs();

    expect(allTabs.length).toBe(3);
    expect(allTabs[0].tab.id).toBe(result1!.tab.id);
    expect(allTabs[1].tab.id).toBe(result2!.tab.id);
    expect(allTabs[2].tab.id).toBe(result3!.tab.id);
  });

  test('should return all tabs from multiple desktops', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    // Open tabs on desktop 1 (default)
    const result1 = await browser.openURL('http://example1.com');

    // Switch to desktop 2 and open tabs
    w.selectDesktop(2);
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    // Switch to desktop 3 and open a tab
    w.selectDesktop(3);
    const result4 = await browser.openURL('http://example4.com');

    const allTabs = w.getAllTabs();

    expect(allTabs.length).toBe(4);

    // Verify each tab is present
    const tabIds = allTabs.map((t) => t.tab.id);
    expect(tabIds).toContain(result1!.tab.id);
    expect(tabIds).toContain(result2!.tab.id);
    expect(tabIds).toContain(result3!.tab.id);
    expect(tabIds).toContain(result4!.tab.id);
  });

  test('should return tabs with correct desktop and tabContainer references', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    const allTabs = w.getAllTabs();

    expect(allTabs.length).toBe(1);
    expect(allTabs[0].desktop.id).toBe(result!.desktop.id);
    expect(allTabs[0].tabContainer.id).toBe(result!.tabContainer.id);
    expect(allTabs[0].tab.id).toBe(result!.tab.id);
  });
});

describe('suspendTab', () => {
  test('should suspend a tab and return true', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab } = result!;

    // Select the tab first
    await w.selectTab(tab.id);
    expect(tab.suspended).toBe(false);

    const suspended = await w.suspendTab(tab.id);

    expect(suspended).toBe(true);
    expect(tab.suspended).toBe(true);
  });

  test('should return false when tab does not exist', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const suspended = await w.suspendTab(999 as any);

    expect(suspended).toBe(false);
  });

  test('should deselect tab container when suspending selected tab', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, desktop, tabContainer } = result!;

    // Select the tab
    await w.selectTab(tab.id);
    expect(desktop.selectedTabContainer?.id).toBe(tabContainer.id);
    expect(tabContainer.selectedTab?.id).toBe(tab.id);

    // Suspend the tab
    await w.suspendTab(tab.id);

    expect(tabContainer.selectedTab).toBeNull();
  });

  test('should deselect desktop tab container if suspended tab is selected', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, desktop, tabContainer } = result!;

    // Select the tab
    await w.selectTab(tab.id);
    expect(desktop.selectedTabContainer?.id).toBe(tabContainer.id);

    // Suspend the tab
    await w.suspendTab(tab.id);

    expect(desktop.selectedTabContainer).toBeNull();
  });

  test('should emit window:tab-did-suspend event', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    const { tab } = result!;

    await w.selectTab(tab.id);

    const eventSpy = vi.fn();
    w.eventsChannel.on('window:tab-did-suspend', eventSpy);

    await w.suspendTab(tab.id);

    expect(eventSpy).toHaveBeenCalledWith(w);
  });

  test('should suspend all tabs in the tab container', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    // Open first tab which creates a tab container
    const result1 = await browser.openURL('http://example1.com');
    expect(result1).not.toBeNull();

    const { tab: tab1 } = result1!;

    // Manually activate tab1
    tab1.activate();
    expect(tab1.suspended).toBe(false);

    // Suspend the tab
    const result = await w.suspendTab(tab1.id);
    expect(result).toBe(true);

    // Tab should be suspended
    expect(tab1.suspended).toBe(true);

    // Verify the tab container was deselected
    expect(w.selectedDesktop.selectedTabContainer).toBeNull();
  });
});

describe('getLastAccessedTab', () => {
  test('should return null when no tabs exist', () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const lastTab = w.getLastAccessedTab();

    expect(lastTab).toBeNull();
  });

  test('should return the most recently accessed tab', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result3).not.toBeNull();

    // Select tabs in a specific order to set lastAccessed timestamps
    await w.selectTab(result1!.tab.id);
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to ensure different timestamps

    await w.selectTab(result2!.tab.id);
    await new Promise((resolve) => setTimeout(resolve, 10));

    await w.selectTab(result3!.tab.id);
    await new Promise((resolve) => setTimeout(resolve, 10));

    const lastTab = w.getLastAccessedTab();

    expect(lastTab).not.toBeNull();
    expect(lastTab!.tab.id).toBe(result3!.tab.id);
  });

  test('should exclude suspended tabs', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();

    // Verify they are in different containers
    expect(result1!.tabContainer.id).not.toBe(result2!.tabContainer.id);

    // Manually activate both tabs
    result1!.tab.activate();
    result2!.tab.activate();

    // Verify both are not suspended
    expect(result1!.tab.suspended).toBe(false);
    expect(result2!.tab.suspended).toBe(false);

    // Update last accessed times with a delay
    result1!.tab.updateLastAccessed();
    await new Promise((resolve) => setTimeout(resolve, 10));
    result2!.tab.updateLastAccessed();
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Manually suspend result2 to test filtering
    result2!.tab.suspend();
    expect(result2!.tab.suspended).toBe(true);

    // Result1 should still not be suspended
    expect(result1!.tab.suspended).toBe(false);

    const lastTab = w.getLastAccessedTab();

    expect(lastTab).not.toBeNull();
    expect(lastTab!.tab.id).toBe(result1!.tab.id);
  });

  test('should filter by desktop when provided', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const desktop1 = w.getDesktop(1)!;
    const desktop2 = w.getDesktop(2)!;

    // Open tab on desktop 1
    const result1 = await browser.openURL('http://example1.com');

    // Switch to desktop 2 and open tab
    w.selectDesktop(2);
    const result2 = await browser.openURL('http://example2.com');

    // Manually activate both tabs
    result1!.tab.activate();
    result2!.tab.activate();

    // Update last accessed with delays
    result1!.tab.updateLastAccessed();
    await new Promise((resolve) => setTimeout(resolve, 10));
    result2!.tab.updateLastAccessed();
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Get last accessed tab for desktop 1
    const lastTabDesktop1 = w.getLastAccessedTab(desktop1);
    expect(lastTabDesktop1).not.toBeNull();
    expect(lastTabDesktop1!.tab.id).toBe(result1!.tab.id);
    expect(lastTabDesktop1!.desktop.id).toBe(1);

    // Get last accessed tab for desktop 2
    const lastTabDesktop2 = w.getLastAccessedTab(desktop2);
    expect(lastTabDesktop2).not.toBeNull();
    expect(lastTabDesktop2!.tab.id).toBe(result2!.tab.id);
    expect(lastTabDesktop2!.desktop.id).toBe(2);
  });

  test('should return null when all tabs are suspended', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');

    await w.selectTab(result1!.tab.id);
    await w.selectTab(result2!.tab.id);

    // Suspend all tabs
    await w.suspendTab(result1!.tab.id);
    await w.suspendTab(result2!.tab.id);

    const lastTab = w.getLastAccessedTab();

    expect(lastTab).toBeNull();
  });

  test('should return null when filtering by desktop with no non-suspended tabs', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    await w.selectTab(result!.tab.id);

    const desktop = w.getDesktop(1)!;

    // Suspend the tab
    await w.suspendTab(result!.tab.id);

    const lastTab = w.getLastAccessedTab(desktop);

    expect(lastTab).toBeNull();
  });
});

describe('selectTab', () => {
  test('should select a tab by id', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, tabContainer, desktop } = result!;

    await w.selectTab(tab.id);

    expect(desktop.selectedTabContainer?.id).toBe(tabContainer.id);
    expect(tabContainer.selectedTab?.id).toBe(tab.id);
  });

  test('should select next tab when target is "next"', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    // Select first tab
    await w.selectTab(result1!.tab.id);
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);

    // Select next tab
    await w.selectTab('next');
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result2!.tab.id);

    // Select next tab again
    await w.selectTab('next');
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result3!.tab.id);
  });

  test('should wrap around when selecting next tab at the end', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');

    // Select last tab
    await w.selectTab(result2!.tab.id);
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result2!.tab.id);

    // Select next should wrap to first
    await w.selectTab('next');
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);
  });

  test('should select previous tab when target is "prev"', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    // Select third tab
    await w.selectTab(result3!.tab.id);
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result3!.tab.id);

    // Select previous tab
    await w.selectTab('prev');
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result2!.tab.id);

    // Select previous tab again
    await w.selectTab('prev');
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);
  });

  test('should wrap around when selecting previous tab at the start', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');

    // Select first tab
    await w.selectTab(result1!.tab.id);
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);

    // Select previous should wrap to last
    await w.selectTab('prev');
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result2!.tab.id);
  });

  test('should switch desktops when selecting a tab from different desktop', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    // Open tab on desktop 1
    const result1 = await browser.openURL('http://example1.com');

    // Switch to desktop 2 and open tab
    w.selectDesktop(2);
    browser.openURL('http://example2.com');

    expect(w.selectedDesktop.id).toBe(2);

    // Select tab from desktop 1
    await w.selectTab(result1!.tab.id);

    expect(w.selectedDesktop.id).toBe(1);
    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);
  });

  test('should resume suspended tab when selected', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    const { tab } = result!;

    // Select and then suspend the tab
    await w.selectTab(tab.id);
    await w.suspendTab(tab.id);
    expect(tab.suspended).toBe(true);

    // Select the suspended tab
    await w.selectTab(tab.id);

    expect(tab.suspended).toBe(false);
  });

  test('should update lastAccessed timestamp when selecting tab', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    const { tab } = result!;

    const initialLastAccessed = tab.lastAccessed;
    await new Promise((resolve) => setTimeout(resolve, 10));

    await w.selectTab(tab.id);

    expect(tab.lastAccessed).toBeGreaterThan(initialLastAccessed);
  });

  test('should emit window:selected-tab-did-change event', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    const { tab } = result!;

    const eventSpy = vi.fn();
    w.eventsChannel.on('window:selected-tab-did-change', eventSpy);

    await w.selectTab(tab.id);

    expect(eventSpy).toHaveBeenCalledWith(w, tab);
  });

  test('should do nothing when selecting non-existent tab', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    await w.selectTab(result!.tab.id);

    const initialSelectedDesktop = w.selectedDesktop.id;

    // Try to select non-existent tab
    await w.selectTab(999 as any);

    // Should remain unchanged
    expect(w.selectedDesktop.id).toBe(initialSelectedDesktop);
  });

  test('should handle selecting next/prev when no tab container is selected', async () => {
    const browser = new Browser();
    const w = browser.createWindow();
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');

    // Don't select any tab initially
    expect(w.selectedDesktop.selectedTabContainer).toBeNull();

    // Select next should select first tab
    await w.selectTab('next');

    expect(w.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result!.tab.id);
  });
});
