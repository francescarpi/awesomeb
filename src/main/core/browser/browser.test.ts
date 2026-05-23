import { expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions } from '@/core';
import { Layouts } from '../tab/layouts';

describe('Browser', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
  });

  test('should create a browser window successfully', () => {
    const w1 = browser.createWindow(1);
    expect(browser.windows.length).toBe(1);
    expect(w1).toBeDefined();
    expect(browser.getWindow(w1.id)).toBe(w1);
  });

  test('openURL in active window/desktop should create a new tabcontainer and tab', () => {
    const w = browser.createWindow(1);
    w.createDefaultDesktops();

    const desktop = w.selectedDesktop;
    expect(desktop.tabContainers.length).toBe(0);

    const result = browser.openURL('https://example.com');
    expect(result).not.toBeNull();

    expect(desktop.tabContainers.length).toBe(1);
    expect(desktop.tabContainers[0].id).toBe(1);

    expect(desktop.tabContainers[0].tabs.length).toBe(1);
  });

  test('move tab (tabcontainer) to another desktop', async () => {
    const w = browser.createWindow(1);
    w.createDefaultDesktops();

    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();

    expect(result!.desktop.id).toBe(1);

    browser.moveTab(result!.tab.id, 'desktop-2');

    const tabResult = browser.getTab(result!.tab.id);
    expect(tabResult).not.toBeNull();
    expect(tabResult!.desktop.id).toBe(2);

    expect(w.getDesktop(1)?.tabContainers.length).toBe(0);
    expect(w.getDesktop(2)?.tabContainers.length).toBe(1);
  });

  test('duplicate a tab in the same desktop', async () => {
    const w = browser.createWindow(1, { withDesktops: true });
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();

    expect(w.selectedDesktop.tabs.length).toBe(1);

    const duplicateResult = await browser.duplicateTab(result!.tab.id);
    expect(duplicateResult).not.toBeNull();
    expect(w.selectedDesktop.tabs.length).toBe(2);
  });

  test('duplicate a tab with another partition', async () => {
    const w = browser.createWindow(1, { withDesktops: true });
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();

    expect(w.selectedDesktop.tabs.length).toBe(1);

    const duplicateResult = await browser.duplicateTab(result!.tab.id, {
      partitionId: partitions.private.id,
    });

    expect(duplicateResult).not.toBeNull();
    expect(w.selectedDesktop.tabs.length).toBe(2);
    expect(duplicateResult!.tab.partition.id).toBe(partitions.private.id);
  });

  test('move tab to split-tab within same desktop', async () => {
    const w = browser.createWindow(1, { withDesktops: true });
    const desktop = w.selectedDesktop;

    const result1 = await browser.openURL('http://tab1.com', { selectTab: true });
    expect(result1).not.toBeNull();
    expect(desktop.tabContainers.length).toBe(1);
    expect(desktop.selectedTab!.tab.id).toBe(result1!.tab.id);

    const result2 = await browser.openURL('http://tab2.com', { selectTab: true });
    expect(result2).not.toBeNull();
    expect(desktop.tabContainers.length).toBe(2);
    expect(desktop.selectedTab!.tab.id).toBe(result2!.tab.id);

    browser.moveTab(result1!.tab.id, 'split-tab');

    expect(desktop.tabContainers.length).toBe(1);

    const tc = desktop.tabContainers[0];
    expect(tc.tabs.length).toBe(2);
    expect(tc.isSplit).toBe(true);
  });

  describe('Split Tabs', () => {
    describe('Creation', () => {
      test('should open a tab in split mode (into selected tab container)', async () => {
        const w = browser.createWindow(1, { withDesktops: true });
        const desktop = w.selectedDesktop;

        const result1 = await browser.openURL('http://example.com', { selectTab: true });
        expect(result1).not.toBeNull();

        expect(desktop.tabContainers.length).toBe(1);
        const tabContainer = desktop.tabContainers[0];
        expect(tabContainer.tabs.length).toBe(1);

        const result2 = await browser.openURL('http://example2.com', {
          targetId: 'split-tab',
        });
        expect(result2).not.toBeNull();

        expect(desktop.tabContainers.length).toBe(1);
        expect(tabContainer.tabs.length).toBe(2);
        expect(tabContainer.isSplit).toBe(true);
      });

      test('should not allow more than 2 tabs in a tab container', async () => {
        const w = browser.createWindow(1, { withDesktops: true });
        const desktop = w.selectedDesktop;

        const result1 = await browser.openURL('http://example.com', { selectTab: true });
        expect(result1).not.toBeNull();

        const tabContainer = result1!.tabContainer;
        expect(tabContainer.tabs.length).toBe(1);

        const result2 = await browser.openURL('http://example2.com', {
          targetId: 'split-tab',
        });
        expect(result2).not.toBeNull();
        expect(tabContainer.tabs.length).toBe(2);

        const result3 = await browser.openURL('http://example3.com', {
          targetId: 'split-tab',
        });
        expect(result3).not.toBeNull();

        expect(result3!.tabContainer).not.toBe(tabContainer);
        expect(tabContainer.tabs.length).toBe(2);
        expect(desktop.tabContainers.length).toBe(2);
      });
    });

    describe('Rotation', () => {
      test('should rotate tabs clockwise', async () => {
        browser.createWindow(1, { withDesktops: true });

        const result1 = await browser.openURL('http://tab1.com', { selectTab: true });
        await browser.openURL('http://tab2.com', {
          targetId: 'split-tab',
        });

        const tabContainer = result1!.tabContainer;
        const tabsBefore = tabContainer.tabs.map((t) => t.id);

        tabContainer.rotateTabs(true);

        const tabsAfter = tabContainer.tabs.map((t) => t.id);
        expect(tabsAfter[0]).toBe(tabsBefore[1]);
        expect(tabsAfter[1]).toBe(tabsBefore[0]);
      });

      test('should rotate tabs counter-clockwise', async () => {
        browser.createWindow(1, { withDesktops: true });

        const result1 = await browser.openURL('http://tab1.com', { selectTab: true });
        await browser.openURL('http://tab2.com', {
          targetId: 'split-tab',
        });

        const tabContainer = result1!.tabContainer;
        const tabsBefore = tabContainer.tabs.map((t) => t.id);

        tabContainer.rotateTabs(false);

        const tabsAfter = tabContainer.tabs.map((t) => t.id);
        expect(tabsAfter[0]).toBe(tabsBefore[1]);
        expect(tabsAfter[1]).toBe(tabsBefore[0]);
      });

      test('should not rotate when only one tab', async () => {
        browser.createWindow(1, { withDesktops: true });

        const result = await browser.openURL('http://tab1.com');

        const tabContainer = result!.tabContainer;
        const tabsBefore = tabContainer.tabs.map((t) => t.id);

        tabContainer.rotateTabs(true);

        const tabsAfter = tabContainer.tabs.map((t) => t.id);
        expect(tabsAfter).toEqual(tabsBefore);
      });
    });

    describe('Layout', () => {
      test('should change layout from vertical to horizontal', async () => {
        browser.createWindow(1, { withDesktops: true });

        const result1 = await browser.openURL('http://tab1.com', { selectTab: true });
        await browser.openURL('http://tab2.com', {
          targetId: 'split-tab',
        });

        const tabContainer = result1!.tabContainer;
        expect(tabContainer.layout.id).toBe('vertical');

        tabContainer.setLayout(Layouts['horizontal']);

        expect(tabContainer.layout.id).toBe('horizontal');
      });

      test('should change layout size', async () => {
        browser.createWindow(1, { withDesktops: true });

        const result1 = await browser.openURL('http://tab1.com', { selectTab: true });
        await browser.openURL('http://tab2.com', {
          targetId: 'split-tab',
        });

        const tabContainer = result1!.tabContainer;
        expect(tabContainer.layoutSize).toBe(50);

        tabContainer.setLayoutSize(75);

        expect(tabContainer.layoutSize).toBe(75);
      });
    });

    describe('Unsplit', () => {
      test('should unsplit tab container - separates tabs into different containers', async () => {
        const w = browser.createWindow(1, { withDesktops: true });
        const desktop = w.selectedDesktop;

        const result1 = await browser.openURL('http://tab1.com', { selectTab: true });
        const result2 = await browser.openURL('http://tab2.com', {
          targetId: 'split-tab',
        });

        const originalTabContainer = result1!.tabContainer;
        const tabToMove = result2!.tab;

        expect(desktop.tabContainers.length).toBe(1);
        expect(originalTabContainer.tabs.length).toBe(2);

        browser.unsplitTabContainer(originalTabContainer.id);

        expect(desktop.tabContainers.length).toBe(2);
        expect(originalTabContainer.tabs.length).toBe(1);
        expect(originalTabContainer.isSplit).toBe(false);

        const newTabContainer = desktop.tabContainers.find(
          (tc) => tc.id !== originalTabContainer.id,
        );
        expect(newTabContainer).toBeDefined();
        expect(newTabContainer!.tabs.length).toBe(1);
        expect(newTabContainer!.tabs[0].id).toBe(tabToMove.id);

        expect(newTabContainer!.selectedTab?.id).toBe(tabToMove.id);
      });

      test('should not unsplit when tab container is not split', async () => {
        const w = browser.createWindow(1, { withDesktops: true });
        const desktop = w.selectedDesktop;

        const result = await browser.openURL('http://tab1.com');

        const tabContainer = result!.tabContainer;
        expect(tabContainer.tabs.length).toBe(1);
        expect(tabContainer.isSplit).toBe(false);

        browser.unsplitTabContainer(tabContainer.id);

        expect(desktop.tabContainers.length).toBe(1);
        expect(tabContainer.tabs.length).toBe(1);
      });

      test('unsplit after layout change should work correctly', async () => {
        const w = browser.createWindow(1, { withDesktops: true });
        const desktop = w.selectedDesktop;

        const result1 = await browser.openURL('http://tab1.com', { selectTab: true });
        const result2 = await browser.openURL('http://tab2.com', {
          targetId: 'split-tab',
        });

        const tabContainer = result1!.tabContainer;
        tabContainer.setLayout(Layouts['horizontal']);
        expect(tabContainer.layout.id).toBe('horizontal');

        const tabToMoveId = result2!.tab.id;

        browser.unsplitTabContainer(tabContainer.id);

        expect(desktop.tabContainers.length).toBe(2);
        expect(tabContainer.isSplit).toBe(false);

        const newTabContainer = desktop.tabContainers.find((tc) => tc.id !== tabContainer.id);
        expect(newTabContainer!.tabs[0].id).toBe(tabToMoveId);
      });
    });

    describe('Selection', () => {
      test('isSplit should return false for single tab and true for split', async () => {
        browser.createWindow(1, { withDesktops: true });

        const result1 = await browser.openURL('http://tab1.com', { selectTab: true });
        const tabContainer = result1!.tabContainer;

        expect(tabContainer.tabs.length).toBe(1);

        await browser.openURL('http://tab2.com', {
          targetId: 'split-tab',
        });

        expect(tabContainer.tabs.length).toBe(2);
      });

      test('openURL with selectTab should select the new tab in split', async () => {
        browser.createWindow(1, { withDesktops: true });

        await browser.openURL('http://tab1.com', { selectTab: true });
        const result2 = await browser.openURL('http://tab2.com', {
          targetId: 'split-tab',
          selectTab: true,
        });

        expect(result2!.tabContainer.selectedTab?.id).toBe(result2!.tab.id);
      });
    });
  });
});
