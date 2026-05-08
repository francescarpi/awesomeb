import { expect, test, describe, vi, beforeEach } from 'vitest';
import { Browser, partitions, TabContainer, Window } from '@/core';
import { MIN_DESKTOPS } from './constants';

describe('Window', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('recent created window should have MIN_DESKTOPS', () => {
    expect(window.desktops.length).toBe(MIN_DESKTOPS);

    for (let i = 0; i < MIN_DESKTOPS; i++) {
      expect(window.desktops[i].id).toBe(i + 1);
      expect(window.desktops[i].label).toBe(`${i + 1}: Unnamed`);
    }
  });

  test('go to next and previous desktop should work correctly', () => {
    expect(window.selectedDesktop.id).toBe(1);

    window.selectDesktop('prev');
    expect(window.selectedDesktop.id).toBe(5);

    window.selectDesktop('next');
    expect(window.selectedDesktop.id).toBe(1);

    window.selectDesktop(5);
    expect(window.selectedDesktop.id).toBe(5);

    window.selectDesktop('next');
    expect(window.selectedDesktop.id).toBe(1);
  });

  test('select tab should work correctly', () => {
    expect(window.selectedDesktop.id).toBe(1);
    const desktop = window.selectDesktop(3);
    expect(window.selectedDesktop.id).toBe(3);
    expect(desktop).not.toBeNull();
    expect(desktop?.selectedTabContainer).toBeNull();

    browser.openURL('http://example.com').then((result) => {
      expect(result).not.toBeNull();

      const { tab, window, tabContainer } = result!;

      window.selectTab(tab.id).then(() => {
        expect(desktop!.selectedTabContainer).not.toBeNull();
        expect(desktop!.selectedTabContainer?.id).toBe(tabContainer.id);
        expect(desktop!.selectedTabContainer!.selectedTab).not.toBeNull();
        expect(desktop!.selectedTabContainer!.selectedTab!.id).toBe(tab.id);
      });
    });
  });
});

describe('Window Tabs', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('should return empty array when no tabs exist', () => {
    const allTabs = window.tabs;

    expect(allTabs).toEqual([]);
    expect(allTabs.length).toBe(0);
  });

  test('should return all tabs from a single desktop', async () => {
    // Open multiple tabs on desktop 1
    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    const allTabs = window.tabs;

    expect(allTabs.length).toBe(3);
    expect(allTabs[0].tab.id).toBe(result1!.tab.id);
    expect(allTabs[1].tab.id).toBe(result2!.tab.id);
    expect(allTabs[2].tab.id).toBe(result3!.tab.id);
  });

  test('should return all tabs from multiple desktops', async () => {
    // Open tabs on desktop 1 (default)
    const result1 = await browser.openURL('http://example1.com');

    // Switch to desktop 2 and open tabs
    window.selectDesktop(2);
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    // Switch to desktop 3 and open a tab
    window.selectDesktop(3);
    const result4 = await browser.openURL('http://example4.com');

    const allTabs = window.tabs;

    expect(allTabs.length).toBe(4);

    // Verify each tab is present
    const tabIds = allTabs.map((t) => t.tab.id);
    expect(tabIds).toContain(result1!.tab.id);
    expect(tabIds).toContain(result2!.tab.id);
    expect(tabIds).toContain(result3!.tab.id);
    expect(tabIds).toContain(result4!.tab.id);
  });

  test('should return tabs with correct desktop and tabContainer references', async () => {
    const result = await browser.openURL('http://example.com');
    const allTabs = window.tabs;

    expect(allTabs.length).toBe(1);
    expect(allTabs[0].desktop.id).toBe(result!.desktop.id);
    expect(allTabs[0].tabContainer.id).toBe(result!.tabContainer.id);
    expect(allTabs[0].tab.id).toBe(result!.tab.id);
  });
});

describe('Window Suspend Tab', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('should suspend a tab and return true', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab } = result!;

    // Select the tab first
    await window.selectTab(tab.id);
    expect(tab.suspended).toBe(false);

    const suspended = await window.suspendTab(tab.id);

    expect(suspended).toBe(true);
    expect(tab.suspended).toBe(true);
  });

  test('should return false when tab does not exist', async () => {
    const suspended = await window.suspendTab(999 as any);
    expect(suspended).toBe(false);
  });

  test('should deselect tab container when suspending selected tab', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, desktop, tabContainer } = result!;

    // Select the tab
    await window.selectTab(tab.id);
    expect(desktop.selectedTabContainer?.id).toBe(tabContainer.id);
    expect(tabContainer.selectedTab?.id).toBe(tab.id);

    // Suspend the tab
    await window.suspendTab(tab.id);

    expect(tabContainer.selectedTab).toBeNull();
  });

  test('should deselect desktop tab container if suspended tab is selected', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, desktop, tabContainer } = result!;

    // Select the tab
    await window.selectTab(tab.id);
    expect(desktop.selectedTabContainer?.id).toBe(tabContainer.id);

    // Suspend the tab
    await window.suspendTab(tab.id);

    expect(desktop.selectedTabContainer).toBeNull();
  });

  test('should emit window:tab-did-suspend event', async () => {
    const result = await browser.openURL('http://example.com');
    const { tab } = result!;

    await window.selectTab(tab.id);

    const eventSpy = vi.fn();
    window.eventsChannel.on('window:tab-did-suspend', eventSpy);

    await window.suspendTab(tab.id);

    expect(eventSpy).toHaveBeenCalledWith(window);
  });

  test('should suspend all tabs in the tab container', async () => {
    // Open first tab which creates a tab container
    const result1 = await browser.openURL('http://example1.com');
    expect(result1).not.toBeNull();

    const { tab: tab1 } = result1!;

    // Manually activate tab1
    tab1.activate();
    expect(tab1.suspended).toBe(false);

    // Suspend the tab
    const result = await window.suspendTab(tab1.id);
    expect(result).toBe(true);

    // Tab should be suspended
    expect(tab1.suspended).toBe(true);

    // Verify the tab container was deselected
    expect(window.selectedDesktop.selectedTabContainer).toBeNull();
  });
});

describe('Window Last Accessed Tab', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('should return null when no tabs exist', () => {
    const lastTab = window.getLastAccessedTab();
    expect(lastTab).toBeNull();
  });

  test('should return the most recently accessed tab', async () => {
    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result3).not.toBeNull();

    // Select tabs in a specific order to set lastAccessed timestamps
    await window.selectTab(result1!.tab.id);
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to ensure different timestamps

    await window.selectTab(result2!.tab.id);
    await new Promise((resolve) => setTimeout(resolve, 10));

    await window.selectTab(result3!.tab.id);
    await new Promise((resolve) => setTimeout(resolve, 10));

    const lastTab = window.getLastAccessedTab();

    expect(lastTab).not.toBeNull();
    expect(lastTab!.tab.id).toBe(result3!.tab.id);
  });

  test('should exclude suspended tabs', async () => {
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

    const lastTab = window.getLastAccessedTab();

    expect(lastTab).not.toBeNull();
    expect(lastTab!.tab.id).toBe(result1!.tab.id);
  });

  test('should filter by desktop when provided', async () => {
    const desktop1 = window.getDesktop(1)!;
    const desktop2 = window.getDesktop(2)!;

    // Open tab on desktop 1
    const result1 = await browser.openURL('http://example1.com');

    // Switch to desktop 2 and open tab
    window.selectDesktop(2);
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
    const lastTabDesktop1 = window.getLastAccessedTab(desktop1);
    expect(lastTabDesktop1).not.toBeNull();
    expect(lastTabDesktop1!.tab.id).toBe(result1!.tab.id);
    expect(lastTabDesktop1!.desktop.id).toBe(1);

    // Get last accessed tab for desktop 2
    const lastTabDesktop2 = window.getLastAccessedTab(desktop2);
    expect(lastTabDesktop2).not.toBeNull();
    expect(lastTabDesktop2!.tab.id).toBe(result2!.tab.id);
    expect(lastTabDesktop2!.desktop.id).toBe(2);
  });

  test('should return null when all tabs are suspended', async () => {
    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');

    await window.selectTab(result1!.tab.id);
    await window.selectTab(result2!.tab.id);

    // Suspend all tabs
    await window.suspendTab(result1!.tab.id);
    await window.suspendTab(result2!.tab.id);

    const lastTab = window.getLastAccessedTab();

    expect(lastTab).toBeNull();
  });

  test('should return null when filtering by desktop with no non-suspended tabs', async () => {
    const result = await browser.openURL('http://example.com');
    await window.selectTab(result!.tab.id);

    const desktop = window.getDesktop(1)!;

    // Suspend the tab
    await window.suspendTab(result!.tab.id);

    const lastTab = window.getLastAccessedTab(desktop);

    expect(lastTab).toBeNull();
  });
});

describe('Window Selecdt Tab', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('should select a tab by id', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, tabContainer, desktop } = result!;

    await window.selectTab(tab.id);

    expect(desktop.selectedTabContainer?.id).toBe(tabContainer.id);
    expect(tabContainer.selectedTab?.id).toBe(tab.id);
  });

  test('should select next tab when target is "next"', async () => {
    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    // Select first tab
    await window.selectTab(result1!.tab.id);
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);

    // Select next tab
    await window.selectTab('next');
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result2!.tab.id);

    // Select next tab again
    await window.selectTab('next');
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result3!.tab.id);
  });

  test('should wrap around when selecting next tab at the end', async () => {
    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');

    // Select last tab
    await window.selectTab(result2!.tab.id);
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result2!.tab.id);

    // Select next should wrap to first
    await window.selectTab('next');
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);
  });

  test('should select previous tab when target is "prev"', async () => {
    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    // Select third tab
    await window.selectTab(result3!.tab.id);
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result3!.tab.id);

    // Select previous tab
    await window.selectTab('prev');
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result2!.tab.id);

    // Select previous tab again
    await window.selectTab('prev');
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);
  });

  test('should wrap around when selecting previous tab at the start', async () => {
    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');

    // Select first tab
    await window.selectTab(result1!.tab.id);
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);

    // Select previous should wrap to last
    await window.selectTab('prev');
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result2!.tab.id);
  });

  test('should switch desktops when selecting a tab from different desktop', async () => {
    // Open tab on desktop 1
    const result1 = await browser.openURL('http://example1.com');

    // Switch to desktop 2 and open tab
    window.selectDesktop(2);
    browser.openURL('http://example2.com');

    expect(window.selectedDesktop.id).toBe(2);

    // Select tab from desktop 1
    await window.selectTab(result1!.tab.id);

    expect(window.selectedDesktop.id).toBe(1);
    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result1!.tab.id);
  });

  test('should resume suspended tab when selected', async () => {
    const result = await browser.openURL('http://example.com');
    const { tab } = result!;

    // Select and then suspend the tab
    await window.selectTab(tab.id);
    await window.suspendTab(tab.id);
    expect(tab.suspended).toBe(true);

    // Select the suspended tab
    await window.selectTab(tab.id);

    expect(tab.suspended).toBe(false);
  });

  test('should update lastAccessed timestamp when selecting tab', async () => {
    const result = await browser.openURL('http://example.com');
    const { tab } = result!;

    const initialLastAccessed = tab.lastAccessed;
    await new Promise((resolve) => setTimeout(resolve, 10));

    await window.selectTab(tab.id);

    expect(tab.lastAccessed).toBeGreaterThan(initialLastAccessed);
  });

  test('should emit window:selected-tab-did-change event', async () => {
    const result = await browser.openURL('http://example.com');
    const { tab } = result!;

    const eventSpy = vi.fn();
    window.eventsChannel.on('window:selected-tab-did-change', eventSpy);

    await window.selectTab(tab.id);

    expect(eventSpy).toHaveBeenCalledWith(window, tab);
  });

  test('should do nothing when selecting non-existent tab', async () => {
    const result = await browser.openURL('http://example.com');
    await window.selectTab(result!.tab.id);

    const initialSelectedDesktop = window.selectedDesktop.id;

    // Try to select non-existent tab
    await window.selectTab(999 as any);

    // Should remain unchanged
    expect(window.selectedDesktop.id).toBe(initialSelectedDesktop);
  });

  test('should handle selecting next/prev when no tab container is selected', async () => {
    const result = await browser.openURL('http://example.com', { selectTab: true });

    // Select any tab initially
    expect(window.selectedDesktop.selectedTabContainer).not.toBeNull();

    // Select next should select first tab
    await window.selectTab('next');

    expect(window.selectedDesktop.selectedTabContainer?.selectedTab?.id).toBe(result!.tab.id);
  });
});

describe('Window Close Tab', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('should close a tab and return true', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, tabContainer } = result!;

    expect(tabContainer.tabs.length).toBe(1);

    const closed = await browser.closeTab(tab.id);

    expect(closed).toBe(true);
    expect(tabContainer.tabs.length).toBe(0);
  });

  test('should return false when tab does not exist', async () => {
    const closed = await browser.closeTab(999 as any);
    expect(closed).toBe(false);
  });

  test('should emit window:tab-did-close event', async () => {
    const result = await browser.openURL('http://example.com');
    const { tab } = result!;

    const eventSpy = vi.fn();
    window.eventsChannel.on('window:tab-did-close', eventSpy);

    await browser.closeTab(tab.id);

    expect(eventSpy).toHaveBeenCalledWith(window);
  });

  test('should close tab container when it becomes empty', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, tabContainer, desktop } = result!;

    expect(desktop.tabContainers.length).toBe(1);
    expect(desktop.tabContainers[0].id).toBe(tabContainer.id);

    await browser.closeTab(tab.id);

    expect(desktop.tabContainers.length).toBe(0);
  });

  test('should deselect tab container when closed tab container was selected', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, desktop, tabContainer } = result!;

    // Select the tab
    await window.selectTab(tab.id);
    expect(desktop.selectedTabContainer?.id).toBe(tabContainer.id);

    // Close the tab
    await browser.closeTab(tab.id);

    expect(desktop.selectedTabContainer).toBeNull();
  });

  test('should not close tab container when it has remaining tabs', async () => {
    const desktop = window.selectedDesktop;

    // Create a tab container with multiple tabs
    const tabContainer = new TabContainer(browser, 1 as any);

    const tab1 = tabContainer.createTab(1, {
      partition: partitions.default,
      url: 'http://example1.com',
    });

    const tab2 = tabContainer.createTab(2, {
      partition: partitions.default,
      url: 'http://example2.com',
    });

    desktop.addTabContainer(tabContainer);

    expect(tabContainer.tabs.length).toBe(2);
    expect(desktop.tabContainers.length).toBe(1);

    // Close the first tab
    await browser.closeTab(tab1.id);

    // Tab container should still exist with one tab
    expect(tabContainer.tabs.length).toBe(1);
    expect(desktop.tabContainers.length).toBe(1);
    expect(tabContainer.getTab(tab2.id)).toBe(tab2);
  });

  test('should handle closing tab from different desktop', async () => {
    const desktop1 = window.getDesktop(1)!;

    // Open tab on desktop 1
    const result1 = await browser.openURL('http://example1.com');
    expect(result1).not.toBeNull();
    expect(result1!.desktop.id).toBe(1);

    // Switch to desktop 2 and open tab
    window.selectDesktop(2);
    const result2 = await browser.openURL('http://example2.com');
    expect(result2).not.toBeNull();
    expect(result2!.desktop.id).toBe(2);

    expect(window.selectedDesktop.id).toBe(2);

    // Verify result1 tab exists on desktop 1
    const tabBeforeClose = desktop1.getTab(result1!.tab.id);
    expect(tabBeforeClose).not.toBeNull();

    // Close tab from desktop 1 while on desktop 2
    const closed = await browser.closeTab(result1!.tab.id);

    expect(closed).toBe(true);
    expect(window.selectedDesktop.id).toBe(2); // Should remain on desktop 2

    // Verify tab is removed from desktop 1
    const tabAfterClose = desktop1.getTab(result1!.tab.id);
    expect(tabAfterClose).toBeNull();

    // Verify result2 tab still exists
    expect(window.getTab(result2!.tab.id)).not.toBeNull();
  });

  test('should handle closing multiple tabs sequentially', async () => {
    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    expect(window.tabs.length).toBe(3);

    await browser.closeTab(result1!.tab.id);
    expect(window.tabs.length).toBe(2);

    await browser.closeTab(result2!.tab.id);
    expect(window.tabs.length).toBe(1);

    await browser.closeTab(result3!.tab.id);
    expect(window.tabs.length).toBe(0);
  });

  test('should handle closing currently selected tab', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, tabContainer, desktop } = result!;

    // Select the tab
    await window.selectTab(tab.id);
    expect(desktop.selectedTabContainer?.selectedTab?.id).toBe(tab.id);

    // Close the selected tab
    await browser.closeTab(tab.id);

    // Tab should be gone
    expect(tabContainer.selectedTab).toBeNull();
    expect(desktop.selectedTabContainer).toBeNull();
  });

  test('should refresh visible tab view after closing tab', async () => {
    const result1 = await browser.openURL('http://example1.com');
    await browser.openURL('http://example2.com');

    // Select first tab
    await window.selectTab(result1!.tab.id);

    const refreshSpy = vi.spyOn(window, 'renderViews');

    // Close the tab
    await browser.closeTab(result1!.tab.id);

    expect(refreshSpy).toHaveBeenCalled();

    refreshSpy.mockRestore();
  });

  test('should handle closing tab when container has no selected tab', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();
    const { tab, tabContainer } = result!;

    // Manually deselect the tab in the container
    tabContainer.selectTab(null);
    expect(tabContainer.selectedTab).toBeNull();

    // Close the tab
    const closed = await browser.closeTab(tab.id);

    expect(closed).toBe(true);
    expect(tabContainer.tabs.length).toBe(0);
  });

  test('should handle closing all tabs across all desktops', async () => {
    // Open tabs on multiple desktops
    const result1 = await browser.openURL('http://example1.com');
    window.selectDesktop(2);
    const result2 = await browser.openURL('http://example2.com');
    window.selectDesktop(3);
    const result3 = await browser.openURL('http://example3.com');

    expect(window.tabs.length).toBe(3);

    // Close all tabs
    await browser.closeTab(result1!.tab.id);
    await browser.closeTab(result2!.tab.id);
    await browser.closeTab(result3!.tab.id);

    expect(window.tabs.length).toBe(0);
    expect(window.getDesktop(1)!.tabContainers.length).toBe(0);
    expect(window.getDesktop(2)!.tabContainers.length).toBe(0);
    expect(window.getDesktop(3)!.tabContainers.length).toBe(0);
  });
});

describe('Window Move Desktop', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('move desktop left should swap desktops in the map', () => {
    const origDesktop1 = window.getDesktop(1)!;
    const origDesktop2 = window.getDesktop(2)!;

    window.moveDesktop(2, 'left');

    expect(window.getDesktop(1)).toBe(origDesktop2);
    expect(window.getDesktop(1)!.id).toBe(1);

    expect(window.getDesktop(2)).toBe(origDesktop1);
    expect(window.getDesktop(2)!.id).toBe(2);
  });

  test('move desktop right should swap desktops in the map', () => {
    const origDesktop1 = window.getDesktop(1)!;
    const origDesktop2 = window.getDesktop(2)!;

    window.moveDesktop(1, 'right');

    expect(window.getDesktop(1)).toBe(origDesktop2);
    expect(window.getDesktop(1)!.id).toBe(1);

    expect(window.getDesktop(2)).toBe(origDesktop1);
    expect(window.getDesktop(2)!.id).toBe(2);
  });

  test('move left at first position does nothing', () => {
    expect(window.getDesktop(1)!.id).toBe(1);

    window.moveDesktop(1, 'left');

    expect(window.getDesktop(1)!.id).toBe(1);
    expect(window.desktops.length).toBe(MIN_DESKTOPS);
  });

  test('move right at last position does nothing', () => {
    expect(window.getDesktop(MIN_DESKTOPS)!.id).toBe(MIN_DESKTOPS);

    window.moveDesktop(MIN_DESKTOPS, 'right');

    expect(window.getDesktop(MIN_DESKTOPS)!.id).toBe(MIN_DESKTOPS);
    expect(window.desktops.length).toBe(MIN_DESKTOPS);
  });

  test('iteration order stays sequential by id after moving right', () => {
    const origD3 = window.getDesktop(3)!;
    const origD4 = window.getDesktop(4)!;

    window.moveDesktop(3, 'right');

    expect(window.desktops.map((d) => d.id)).toEqual([1, 2, 3, 4, 5]);
    expect(window.getDesktop(3)).toBe(origD4);
    expect(window.getDesktop(4)).toBe(origD3);
  });

  test('iteration order stays sequential by id after moving left', () => {
    const origD1 = window.getDesktop(1)!;
    const origD2 = window.getDesktop(2)!;

    window.moveDesktop(2, 'left');

    expect(window.desktops.map((d) => d.id)).toEqual([1, 2, 3, 4, 5]);
    expect(window.getDesktop(1)).toBe(origD2);
    expect(window.getDesktop(2)).toBe(origD1);
  });

  test('selected desktop follows the move', () => {
    window.selectDesktop(2);
    expect(window.selectedDesktop.id).toBe(2);

    window.moveDesktop(2, 'left');

    expect(window.selectedDesktop.id).toBe(1);
  });

  test('label updates after move', () => {
    const d1 = window.getDesktop(1)!;
    const d2 = window.getDesktop(2)!;

    d1.setName('Work');
    d2.setName('Personal');

    window.moveDesktop(2, 'left');

    // d1 was at position 1, now at position 2 (id=2, name=Work)
    expect(d1.label).toBe('2: Work');
    // d2 was at position 2, now at position 1 (id=1, name=Personal)
    expect(d2.label).toBe('1: Personal');
  });

  test('move desktop emits desktops-order-did-change event', () => {
    const eventSpy = vi.fn();
    window.eventsChannel.on('window:desktops-order-did-change', eventSpy);

    window.moveDesktop(2, 'left');

    expect(eventSpy).toHaveBeenCalledWith(window);
  });

  test('tabs follow desktop when moving left', async () => {
    window.selectDesktop(2);
    const result = await browser.openURL('http://example.com');

    expect(window.getDesktop(1)!.tabs.length).toBe(0);
    expect(window.getDesktop(2)!.tabs.length).toBe(1);

    window.moveDesktop(2, 'left');

    expect(window.getDesktop(1)!.tabs.length).toBe(1);
    expect(window.getDesktop(1)!.getTab(result!.tab.id)).not.toBeNull();

    expect(window.getDesktop(2)!.tabs.length).toBe(0);
  });

  test('tabs follow desktop when moving right', async () => {
    window.selectDesktop(1);
    const result = await browser.openURL('http://example.com');

    expect(window.getDesktop(1)!.tabs.length).toBe(1);
    expect(window.getDesktop(2)!.tabs.length).toBe(0);

    window.moveDesktop(1, 'right');

    expect(window.getDesktop(2)!.tabs.length).toBe(1);
    expect(window.getDesktop(2)!.getTab(result!.tab.id)).not.toBeNull();

    expect(window.getDesktop(1)!.tabs.length).toBe(0);
  });

  test('tab desktop property reflects moved id', async () => {
    window.selectDesktop(2);
    const result = await browser.openURL('http://example.com');

    expect(result!.desktop.id).toBe(2);

    window.moveDesktop(2, 'left');

    // Same desktop object, now at position 1 with id=1
    expect(result!.desktop.id).toBe(1);
  });
});
