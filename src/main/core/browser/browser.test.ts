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

      test('should not allow more than 3 tabs in a tab container', async () => {
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
        expect(tabContainer.tabs.length).toBe(3);

        const result4 = await browser.openURL('http://example3.com', {
          targetId: 'split-tab',
        });

        expect(result4!.tabContainer).not.toBe(tabContainer);
        expect(tabContainer.tabs.length).toBe(3);

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

  describe('Tab Index', () => {
    test('getTab returns indexed result after openURL', async () => {
      browser.createWindow(1, { withDesktops: true });
      const result = await browser.openURL('http://example.com');
      expect(result).not.toBeNull();

      const lookup = browser.getTab(result!.tab.id);
      expect(lookup).not.toBeNull();
      expect(lookup!.tab.id).toBe(result!.tab.id);
      expect(lookup!.window.id).toBe(result!.window.id);
      expect(lookup!.desktop.id).toBe(result!.desktop.id);
      expect(lookup!.tabContainer.id).toBe(result!.tabContainer.id);
    });

    test('getTab returns null for unknown tab id', () => {
      expect(browser.getTab(99999 as any)).toBeNull();
    });

    test('getTab indexes after closeTab', async () => {
      browser.createWindow(1, { withDesktops: true });
      const result = await browser.openURL('http://example.com');
      expect(result).not.toBeNull();

      const tabId = result!.tab.id;
      expect(browser.getTab(tabId)).not.toBeNull();

      await browser.closeTab(tabId);
      expect(browser.getTab(tabId)).not.toBeNull();
    });

    test('getTab indexes multiple tabs correctly', async () => {
      browser.createWindow(1, { withDesktops: true });
      const result1 = await browser.openURL('http://example1.com');
      const result2 = await browser.openURL('http://example2.com');

      await browser.closeTab(result1!.tab.id);
      expect(browser.getTab(result1!.tab.id)).not.toBeNull();
      expect(browser.getTab(result2!.tab.id)).not.toBeNull();
    });

    test('getTabByWebContentsId finds tab by its webContentsId', async () => {
      browser.createWindow(1, { withDesktops: true });
      const result = await browser.openURL('http://example.com');
      expect(result).not.toBeNull();

      const wcId = result!.tab.webContentsId;
      const lookup = browser.getTabByWebContentsId(wcId);
      expect(lookup).not.toBeNull();
      expect(lookup!.tab.id).toBe(result!.tab.id);
    });

    test('getTabByWebContentsId returns null for unknown id', () => {
      expect(browser.getTabByWebContentsId(99999)).toBeNull();
    });

    test('getTabContainer returns indexed result after openURL', async () => {
      browser.createWindow(1, { withDesktops: true });
      const result = await browser.openURL('http://example.com');
      expect(result).not.toBeNull();

      const lookup = browser.getTabContainer(result!.tabContainer.id);
      expect(lookup).not.toBeNull();
      expect(lookup!.tabContainer.id).toBe(result!.tabContainer.id);
      expect(lookup!.window.id).toBe(result!.window.id);
      expect(lookup!.desktop.id).toBe(result!.desktop.id);
    });

    test('getTabContainer returns null for unknown id', () => {
      expect(browser.getTabContainer(99999 as any)).toBeNull();
    });

    test('getTabContainer stil indexed after close last tab', async () => {
      browser.createWindow(1, { withDesktops: true });
      const result = await browser.openURL('http://example.com');
      expect(result).not.toBeNull();

      const tcId = result!.tabContainer.id;
      expect(browser.getTabContainer(tcId)).not.toBeNull();

      await browser.closeTab(result!.tab.id);
      expect(browser.getTabContainer(tcId)).not.toBeNull();
    });

    test('removeWindow cleans up tab and tabContainer indexes', async () => {
      const w1 = browser.createWindow(1, { withDesktops: true });
      const result = await browser.openURL('http://example.com');

      const tabId = result!.tab.id;
      const tcId = result!.tabContainer.id;

      expect(browser.getTab(tabId)).not.toBeNull();
      expect(browser.getTabContainer(tcId)).not.toBeNull();

      browser.removeWindow(w1.id);

      expect(browser.getTab(tabId)).toBeNull();
      expect(browser.getTabContainer(tcId)).toBeNull();
    });

    test('moveTab updates indexes to target window/desktop', async () => {
      browser.createWindow(1, { withDesktops: true });
      const result = await browser.openURL('http://example.com');
      expect(result).not.toBeNull();

      const tabId = result!.tab.id;

      browser.moveTab(tabId, 'desktop-2');

      const lookup = browser.getTab(tabId);
      expect(lookup).not.toBeNull();
      expect(lookup!.desktop.id).toBe(2);
    });

    test('index cleanup does not affect other windows', async () => {
      const w1 = browser.createWindow(1, { withDesktops: true });
      const result1 = await browser.openURL('http://example1.com');

      browser.createWindow(2, { withDesktops: true });
      const result2 = await browser.openURL('http://example2.com');

      const tab1Id = result1!.tab.id;
      const tab2Id = result2!.tab.id;

      browser.removeWindow(w1.id);

      expect(browser.getTab(tab1Id)).toBeNull();
      expect(browser.getTab(tab2Id)).not.toBeNull();
      expect(browser.getTab(tab2Id)!.tab.id).toBe(tab2Id);
    });
  });

  describe('Cascade close on parent', () => {
    test('closing parent closes all direct children', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = (await browser.openURL('http://parent.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      await browser.openURL('http://child1.com');
      await browser.openURL('http://child2.com');

      const childContainerIds = browser.tabs
        .map((r) => r.tabContainer)
        .filter((tc) => tc.parentTab === parent.tab)
        .map((tc) => tc.id);

      expect(childContainerIds.length).toBe(2);

      await browser.closeTab(parent.tab.id);

      expect(parent.tab.isClosed).toBe(true);
      for (const childContainerId of childContainerIds) {
        const childTabs = browser.tabs
          .filter((r) => r.tabContainer.id === childContainerId)
          .map((r) => r.tab);
        for (const childTab of childTabs) {
          expect(childTab.isClosed).toBe(true);
        }
      }
    });

    test('closing parent closes entire subtree (grandchildren too)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const grandparent = (await browser.openURL('http://gp.com', { selectTab: true }))!;
      grandparent.tab.setOpenTabsAsChild(true);
      const child = (await browser.openURL('http://child.com', { selectTab: true }))!;
      child.tab.setOpenTabsAsChild(true);
      const grandchild = (await browser.openURL('http://grandchild.com'))!;

      await browser.closeTab(grandparent.tab.id);

      expect(grandparent.tab.isClosed).toBe(true);
      expect(child.tab.isClosed).toBe(true);
      expect(grandchild.tab.isClosed).toBe(true);
    });

    test('closing a non-parent tab does not cascade', async () => {
      browser.createWindow(1, { withDesktops: true });
      const unrelated1 = (await browser.openURL('http://u1.com'))!;
      const unrelated2 = (await browser.openURL('http://u2.com'))!;

      await browser.closeTab(unrelated1.tab.id);

      expect(unrelated1.tab.isClosed).toBe(true);
      expect(unrelated2.tab.isClosed).toBe(false);
    });

    test('closing a child does not close its parent (cascade is downward only)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = (await browser.openURL('http://parent.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      const child = (await browser.openURL('http://child.com'))!;

      await browser.closeTab(child.tab.id);

      expect(child.tab.isClosed).toBe(true);
      expect(parent.tab.isClosed).toBe(false);
    });

    test('closing an already-closed tab is a no-op (idempotent)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const tab = (await browser.openURL('http://example.com'))!;

      await browser.closeTab(tab.tab.id);
      expect(tab.tab.isClosed).toBe(true);

      const result = await browser.closeTab(tab.tab.id);
      expect(result).toBe(false);
    });

    test('closing a tab whose parent is already closed just closes the orphan', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = (await browser.openURL('http://parent.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      const child = (await browser.openURL('http://child.com'))!;

      await browser.closeTab(parent.tab.id);
      expect(parent.tab.isClosed).toBe(true);
      expect(child.tab.isClosed).toBe(true);
    });
  });

  describe('openURL parent auto-detection', () => {
    test('selectedTab.openTabsAsChild=true: new container has parentTab = selectedTab', async () => {
      browser.createWindow(1, { withDesktops: true });
      const jira = (await browser.openURL('http://jira.com'))!;
      jira.tab.setOpenTabsAsChild(true);
      await browser.activeWindow!.selectTab(jira.tab.id);

      const newTab = await browser.openURL('http://ticket.com');

      expect(newTab).not.toBeNull();
      expect(newTab!.tabContainer.parentTab).toBe(jira.tab);
    });

    test('selectedTab.openTabsAsChild=false: new container has no parent', async () => {
      browser.createWindow(1, { withDesktops: true });
      await browser.openURL('http://jira.com');

      const newTab = await browser.openURL('http://ticket.com');

      expect(newTab).not.toBeNull();
      expect(newTab!.tabContainer.parentTab).toBeNull();
    });

    test('skipParent: true prevents auto-detection (popup use case)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const jira = (await browser.openURL('http://jira.com'))!;
      jira.tab.setOpenTabsAsChild(true);
      await browser.activeWindow!.selectTab(jira.tab.id);

      const newTab = await browser.openURL('http://ticket.com', { skipParent: true });

      expect(newTab).not.toBeNull();
      expect(newTab!.tabContainer.parentTab).toBeNull();
    });

    test('targetId=new-window: no parent (different window = different context)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const jira = (await browser.openURL('http://jira.com'))!;
      jira.tab.setOpenTabsAsChild(true);
      await browser.activeWindow!.selectTab(jira.tab.id);

      const newTab = await browser.openURL('http://ticket.com', { targetId: 'new-window' });

      expect(newTab).not.toBeNull();
      expect(newTab!.tabContainer.parentTab).toBeNull();
    });

    test('context menu case: openURL called directly (no disposition) still respects the flag', async () => {
      browser.createWindow(1, { withDesktops: true });
      const jira = (await browser.openURL('http://jira.com'))!;
      jira.tab.setOpenTabsAsChild(true);
      await browser.activeWindow!.selectTab(jira.tab.id);

      const newTab = await browser.openURL('http://ticket.com', { selectTab: true });

      expect(newTab).not.toBeNull();
      expect(newTab!.tabContainer.parentTab).toBe(jira.tab);
    });

    test('child tab.openTabsAsChild remains false regardless of parent flag', async () => {
      browser.createWindow(1, { withDesktops: true });
      const jira = (await browser.openURL('http://jira.com'))!;
      jira.tab.setOpenTabsAsChild(true);
      await browser.activeWindow!.selectTab(jira.tab.id);

      const newTab = await browser.openURL('http://ticket.com');

      expect(newTab).not.toBeNull();
      expect(newTab!.tab.openTabsAsChild).toBe(false);
    });
  });
});
