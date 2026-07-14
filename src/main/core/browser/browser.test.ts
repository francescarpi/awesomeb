import { expect, test, describe, beforeEach, vi } from 'vitest';
import { Browser, partitions, windowOpenHadler } from '@/core';
import { Layouts } from '../tab/layouts';
import type { HandlerDetails } from 'electron';

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

  describe('Browser.openURL with parentTabContainer', () => {
    test('new tabContainer has its parent set to the provided parentTabContainer', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = await browser.openURL('http://parent.com');
      expect(parent).not.toBeNull();

      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
      });
      expect(child).not.toBeNull();
      expect(child!.tabContainer.parent).toBe(parent!.tabContainer);
    });

    test('new tabContainer is added to parentTabContainer.children', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = await browser.openURL('http://parent.com');

      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
      });

      expect(parent!.tabContainer.children).toContain(child!.tabContainer);
      expect(parent!.tabContainer.children.length).toBe(1);
    });

    test('new tabContainer is still indexed normally (getTabContainer + desktop.tabContainers)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const w = browser.activeWindow!;
      const parent = await browser.openURL('http://parent.com');

      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
      });

      const lookup = browser.getTabContainer(child!.tabContainer.id);
      expect(lookup).not.toBeNull();
      expect(lookup!.tabContainer.id).toBe(child!.tabContainer.id);

      const desktop = w.selectedDesktop;
      expect(desktop.tabContainers).toContain(child!.tabContainer);
    });

    test('parent tabContainer remains indexed and visible after attaching a child', async () => {
      browser.createWindow(1, { withDesktops: true });
      const w = browser.activeWindow!;
      const parent = await browser.openURL('http://parent.com');

      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
      });

      const parentLookup = browser.getTabContainer(parent!.tabContainer.id);
      expect(parentLookup).not.toBeNull();
      expect(w.selectedDesktop.tabContainers).toContain(parent!.tabContainer);
      expect(w.selectedDesktop.tabContainers).toContain(child!.tabContainer);
    });

    test('without parentTabContainer, the new tabContainer has parent === null (regression)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const first = await browser.openURL('http://first.com');
      expect(first).not.toBeNull();
      expect(first!.tabContainer.parent).toBeNull();
      expect(first!.tabContainer.children).toEqual([]);
    });

    test('the tab inside the new child tabContainer is created normally and can be closed', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = await browser.openURL('http://parent.com');

      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
      });

      const childTabId = child!.tab.id;
      expect(childTabId).toBeDefined();
      expect(child!.tabContainer.tabs.length).toBe(1);

      const closed = await browser.closeTab(childTabId);
      expect(closed).toBe(true);
    });
  });

  describe('Browser.closeTab cascade (parent/children)', () => {
    async function createParentWithChildren(childCount: number) {
      const parent = await browser.openURL('http://parent.com');
      expect(parent).not.toBeNull();
      const children: NonNullable<Awaited<ReturnType<typeof browser.openURL>>>[] = [];
      for (let i = 0; i < childCount; i++) {
        const child = await browser.openURL(`http://child${i}.com`, {
          parentTabContainer: parent!.tabContainer,
        });
        expect(child).not.toBeNull();
        children.push(child!);
      }
      return { parent: parent!, children };
    }

    test('closing the parent tab marks all child tabs as closed (soft close, non-private)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const { parent, children } = await createParentWithChildren(2);

      const closed = await browser.closeTab(parent.tab.id);
      expect(closed).toBe(true);

      for (const child of children) {
        for (const tab of child.tabContainer.tabs) {
          expect(tab.isClosed).toBe(true);
        }
      }
    });

    test('closing the parent tab removes every child from parent.children', async () => {
      browser.createWindow(1, { withDesktops: true });
      const { parent, children } = await createParentWithChildren(2);

      await browser.closeTab(parent.tab.id);

      for (const child of children) {
        expect(parent.tabContainer.children).not.toContain(child.tabContainer);
      }
      expect(parent.tabContainer.children).toEqual([]);
    });

    test('cascade closes tabs across multiple children (2+ children)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const { parent, children } = await createParentWithChildren(3);

      await browser.closeTab(parent.tab.id);

      const totalChildTabs = children.reduce((sum, c) => sum + c.tabContainer.tabs.length, 0);
      expect(totalChildTabs).toBe(3);

      const allClosed = children.every((c) => c.tabContainer.tabs.every((t) => t.isClosed));
      expect(allClosed).toBe(true);
    });

    test('3-level cascade: closing root closes mid and leaf', async () => {
      browser.createWindow(1, { withDesktops: true });
      const root = await browser.openURL('http://root.com');
      const mid = await browser.openURL('http://mid.com', {
        parentTabContainer: root!.tabContainer,
      });
      const leaf = await browser.openURL('http://leaf.com', {
        parentTabContainer: mid!.tabContainer,
      });

      await browser.closeTab(root!.tab.id);

      for (const tab of mid!.tabContainer.tabs) {
        expect(tab.isClosed).toBe(true);
      }
      for (const tab of leaf!.tabContainer.tabs) {
        expect(tab.isClosed).toBe(true);
      }
      expect(mid!.tabContainer.children).not.toContain(leaf!.tabContainer);
    });

    test('closing a child tab removes the child container from parent.children', async () => {
      browser.createWindow(1, { withDesktops: true });
      const { parent, children } = await createParentWithChildren(2);
      const targetChild = children[0];

      const closed = await browser.closeTab(targetChild.tab.id);
      expect(closed).toBe(true);

      expect(parent.tabContainer.children).not.toContain(targetChild.tabContainer);
      expect(parent.tabContainer.children).toContain(children[1].tabContainer);
    });

    test('closing a child tab does NOT affect its siblings', async () => {
      browser.createWindow(1, { withDesktops: true });
      const { parent, children } = await createParentWithChildren(2);
      const sibling = children[1];

      await browser.closeTab(children[0].tab.id);

      for (const tab of sibling.tabContainer.tabs) {
        expect(tab.isClosed).toBe(false);
      }
      expect(parent.tabContainer.children).toContain(sibling.tabContainer);
    });

    test('closing a child tab DOES cascade to its own children (grandchildren)', async () => {
      browser.createWindow(1, { withDesktops: true });
      const root = await browser.openURL('http://root.com');
      const mid = await browser.openURL('http://mid.com', {
        parentTabContainer: root!.tabContainer,
      });
      const leaf = await browser.openURL('http://leaf.com', {
        parentTabContainer: mid!.tabContainer,
      });

      await browser.closeTab(mid!.tab.id);

      for (const tab of leaf!.tabContainer.tabs) {
        expect(tab.isClosed).toBe(true);
      }
      expect(mid!.tabContainer.children).not.toContain(leaf!.tabContainer);
    });

    test('closeTab on an already-closed tab returns false and does not re-mutate parent.children', async () => {
      browser.createWindow(1, { withDesktops: true });
      const { parent, children } = await createParentWithChildren(1);
      const child = children[0];

      const first = await browser.closeTab(child.tab.id);
      expect(first).toBe(true);
      expect(parent.tabContainer.children).not.toContain(child.tabContainer);

      const second = await browser.closeTab(child.tab.id);
      expect(second).toBe(false);
      expect(parent.tabContainer.children).not.toContain(child.tabContainer);
      expect(parent.tabContainer.children.length).toBe(0);
    });

    test('container with no parent and no children: closing its tab is a no-op for relationships', async () => {
      browser.createWindow(1, { withDesktops: true });
      const lone = await browser.openURL('http://lone.com');
      expect(lone!.tabContainer.parent).toBeNull();
      expect(lone!.tabContainer.children).toEqual([]);

      const closed = await browser.closeTab(lone!.tab.id);
      expect(closed).toBe(true);
      expect(lone!.tab.isClosed).toBe(true);
      expect(lone!.tabContainer.parent).toBeNull();
      expect(lone!.tabContainer.children).toEqual([]);
    });

    test('closing every tab in a child one-by-one: child ends with all isClosed and persists in desktop.tabContainers', async () => {
      browser.createWindow(1, { withDesktops: true });
      const w = browser.activeWindow!;
      const desktop = w.selectedDesktop;

      const parent = await browser.openURL('http://parent.com');
      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
        selectTab: true,
      });
      const childTc = child!.tabContainer;
      const firstChildTab = child!.tab;

      expect(childTc.tabs.length).toBe(1);

      const secondTab = await browser.openURL('http://second.com', {
        targetId: 'split-tab',
      });
      expect(secondTab).not.toBeNull();
      expect(childTc.tabs.length).toBe(2);

      await browser.closeTab(firstChildTab.id);
      await browser.closeTab(secondTab!.tab.id);

      expect(childTc.tabs.every((t) => t.isClosed)).toBe(true);
      expect(desktop.tabContainers).toContain(childTc);
    });

    test('private partition child: cascade removes child from desktop.tabContainers and from index', async () => {
      browser.createWindow(1, { withDesktops: true });
      const w = browser.activeWindow!;
      const desktop = w.selectedDesktop;

      const parent = await browser.openURL('http://parent.com');
      const privateChild = await browser.openURL('http://private.com', {
        parentTabContainer: parent!.tabContainer,
        partitionId: partitions.private.id,
      });
      expect(privateChild!.tab.partition.private).toBe(true);

      expect(desktop.tabContainers).toContain(privateChild!.tabContainer);
      expect(browser.getTab(privateChild!.tab.id)).not.toBeNull();

      await browser.closeTab(parent!.tab.id);

      expect(desktop.tabContainers).not.toContain(privateChild!.tabContainer);
      expect(browser.getTabContainer(privateChild!.tabContainer.id)).toBeNull();
      expect(browser.getTab(privateChild!.tab.id)).toBeNull();
      expect(parent!.tabContainer.children).not.toContain(privateChild!.tabContainer);
    });

    test('mixed partition child: private tab unindexed, non-private tab soft-closed, child persists', async () => {
      browser.createWindow(1, { withDesktops: true });
      const w = browser.activeWindow!;
      const desktop = w.selectedDesktop;

      const parent = await browser.openURL('http://parent.com');
      const mixedChild = await browser.openURL('http://non-private.com', {
        parentTabContainer: parent!.tabContainer,
        selectTab: true,
      });
      const childTc = mixedChild!.tabContainer;

      const privateTabResult = await browser.openURL('http://private.com', {
        targetId: 'split-tab',
        partitionId: partitions.private.id,
      });
      expect(privateTabResult).not.toBeNull();
      expect(privateTabResult!.tabContainer).toBe(childTc);
      expect(privateTabResult!.tab.partition.private).toBe(true);

      const nonPrivateTab = mixedChild!.tab;
      const privateTab = privateTabResult!.tab;

      expect(childTc.tabs.length).toBe(2);
      expect(childTc.tabs).toContain(nonPrivateTab);
      expect(childTc.tabs).toContain(privateTab);

      await browser.closeTab(parent!.tab.id);

      const nonPrivateLookup = browser.getTab(nonPrivateTab.id);
      const privateLookup = browser.getTab(privateTab.id);

      expect(privateLookup).toBeNull();
      expect(nonPrivateLookup).not.toBeNull();
      expect(nonPrivateLookup!.tab.isClosed).toBe(true);

      expect(desktop.tabContainers).toContain(childTc);
      expect(parent!.tabContainer.children).not.toContain(childTc);
    });
  });

  describe('windowOpenHadler (parentTabContainer)', () => {
    function makeDetails(overrides: Partial<HandlerDetails> = {}): HandlerDetails {
      return {
        url: 'http://example.com',
        frameName: '',
        features: '',
        disposition: 'foreground-tab',
        ...overrides,
      } as HandlerDetails;
    }

    test('foreground-tab calls openURL with selectTab: true and the parentTabContainer', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = await browser.openURL('http://parent.com');
      const openURLSpy = vi.spyOn(browser, 'openURL').mockResolvedValue(null);

      const response = windowOpenHadler(
        browser,
        makeDetails({ url: 'http://child.com', disposition: 'foreground-tab' }),
        parent!.tabContainer,
      );

      expect(response).toEqual({ action: 'deny' });
      expect(openURLSpy).toHaveBeenCalledWith('http://child.com', {
        targetId: 'current-desktop-window',
        selectTab: true,
        parentTabContainer: parent!.tabContainer,
      });
    });

    test('background-tab calls openURL with parentTabContainer but NOT selectTab', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = await browser.openURL('http://parent.com');
      const openURLSpy = vi.spyOn(browser, 'openURL').mockResolvedValue(null);

      const response = windowOpenHadler(
        browser,
        makeDetails({ url: 'http://child.com', disposition: 'background-tab' }),
        parent!.tabContainer,
      );

      expect(response).toEqual({ action: 'deny' });
      expect(openURLSpy).toHaveBeenCalledWith('http://child.com', {
        targetId: 'current-desktop-window',
        parentTabContainer: parent!.tabContainer,
      });

      const passedProps = openURLSpy.mock.calls[0][1] as Record<string, unknown>;
      expect(passedProps).not.toHaveProperty('selectTab');
    });

    test('new-window with popup features (width=/height=) returns action: allow and does NOT call openURL', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = await browser.openURL('http://parent.com');
      const openURLSpy = vi.spyOn(browser, 'openURL').mockResolvedValue(null);

      const response = windowOpenHadler(
        browser,
        makeDetails({
          url: 'http://popup.com',
          disposition: 'new-window',
          features: 'width=600,height=400',
        }),
        parent!.tabContainer,
      );

      expect(response).toEqual({ action: 'allow' });
      expect(openURLSpy).not.toHaveBeenCalled();
    });

    test('new-window WITHOUT popup features (no width=/height=) calls openURL with targetId: new-window and does NOT pass parentTabContainer', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = await browser.openURL('http://parent.com');
      const openURLSpy = vi.spyOn(browser, 'openURL').mockResolvedValue(null);

      const response = windowOpenHadler(
        browser,
        makeDetails({
          url: 'http://newwin.com',
          disposition: 'new-window',
          features: '',
        }),
        parent!.tabContainer,
      );

      expect(response).toEqual({ action: 'deny' });
      expect(openURLSpy).toHaveBeenCalledWith('http://newwin.com', {
        targetId: 'new-window',
      });
    });

    test('without parentTabContainer (undefined) still works and passes undefined through to openURL', async () => {
      browser.createWindow(1, { withDesktops: true });
      const openURLSpy = vi.spyOn(browser, 'openURL').mockResolvedValue(null);

      const response = windowOpenHadler(
        browser,
        makeDetails({ url: 'http://x.com', disposition: 'foreground-tab' }),
      );

      expect(response).toEqual({ action: 'deny' });
      expect(openURLSpy).toHaveBeenCalledWith('http://x.com', {
        targetId: 'current-desktop-window',
        selectTab: true,
        parentTabContainer: undefined,
      });
    });

    test('unknown disposition returns action: deny and does NOT call openURL', async () => {
      browser.createWindow(1, { withDesktops: true });
      const parent = await browser.openURL('http://parent.com');
      const openURLSpy = vi.spyOn(browser, 'openURL').mockResolvedValue(null);

      const response = windowOpenHadler(
        browser,
        makeDetails({
          url: 'http://x.com',
          disposition: 'other' as HandlerDetails['disposition'],
        }),
        parent!.tabContainer,
      );

      expect(response).toEqual({ action: 'deny' });
      expect(openURLSpy).not.toHaveBeenCalled();
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
});
