import { expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions, Window, Desktop, TabContainer } from '@/core';

describe('Browser.moveTabToPosition', () => {
  let browser: Browser;
  let window: Window;
  let desktop: Desktop;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1, { withDesktops: true });
    desktop = window.getDesktop(1)!;
  });

  async function openTab(url: string, parentTabContainer?: TabContainer) {
    const result = await browser.openURL(url, { parentTabContainer, selectTab: true });
    return result!;
  }

  function tabIds(tc: TabContainer) {
    return tc.tabs.map((t) => t.id);
  }

  describe('reordering inside the same container', () => {
    test('moves a tab before the target tab', async () => {
      const a = await openTab('http://a.com');
      const b = await browser.openURL('http://b.com', { targetId: 'split-tab' });
      const c = await browser.openURL('http://c.com', { targetId: 'split-tab' });
      const tc = a.tabContainer;

      expect(tabIds(tc)).toEqual([a.tab.id, b!.tab.id, c!.tab.id]);

      browser.moveTabToPosition(c!.tab.id, { kind: 'before-tab', targetTabId: a.tab.id });

      expect(tabIds(tc)).toEqual([c!.tab.id, a.tab.id, b!.tab.id]);
    });

    test('moves a tab after the target tab', async () => {
      const a = await openTab('http://a.com');
      const b = await browser.openURL('http://b.com', { targetId: 'split-tab' });
      const c = await browser.openURL('http://c.com', { targetId: 'split-tab' });
      const tc = a.tabContainer;

      browser.moveTabToPosition(a.tab.id, { kind: 'after-tab', targetTabId: c!.tab.id });

      expect(tabIds(tc)).toEqual([b!.tab.id, c!.tab.id, a.tab.id]);
    });

    test('moves the last tab to the first position', async () => {
      const a = await openTab('http://a.com');
      const b = await browser.openURL('http://b.com', { targetId: 'split-tab' });
      const c = await browser.openURL('http://c.com', { targetId: 'split-tab' });
      const tc = a.tabContainer;

      browser.moveTabToPosition(c!.tab.id, { kind: 'before-tab', targetTabId: a.tab.id });

      expect(tabIds(tc)).toEqual([c!.tab.id, a.tab.id, b!.tab.id]);
    });

    test('keeps the container in the desktop and the tab indexed', async () => {
      const a = await openTab('http://a.com');
      const b = await browser.openURL('http://b.com', { targetId: 'split-tab' });

      browser.moveTabToPosition(a.tab.id, { kind: 'after-tab', targetTabId: b!.tab.id });

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([a.tabContainer.id]);
      expect(browser.getTab(a.tab.id)?.tabContainer.id).toBe(a.tabContainer.id);
    });

    test('does not change the selection', async () => {
      const a = await openTab('http://a.com');
      const b = await browser.openURL('http://b.com', { targetId: 'split-tab' });
      const tc = a.tabContainer;
      tc.selectTab(a.tab.id);

      browser.moveTabToPosition(a.tab.id, { kind: 'after-tab', targetTabId: b!.tab.id });

      expect(tc.selectedTab?.id).toBe(a.tab.id);
    });
  });

  describe('moving a tab into another container', () => {
    test('moves the tab into the target container when the source keeps other tabs', async () => {
      const source = await openTab('http://source.com');
      const sibling = await browser.openURL('http://sibling.com', { targetId: 'split-tab' });
      const target = await openTab('http://target.com');

      browser.moveTabToPosition(sibling!.tab.id, {
        kind: 'before-tab',
        targetTabId: target.tab.id,
      });

      expect(tabIds(source.tabContainer)).toEqual([source.tab.id]);
      expect(tabIds(target.tabContainer)).toEqual([sibling!.tab.id, target.tab.id]);
      expect(browser.getTab(sibling!.tab.id)?.tabContainer.id).toBe(target.tabContainer.id);
    });

    test('moves the tab to the end of the target container when dropped after its last tab', async () => {
      const source = await openTab('http://source.com');
      const sibling = await browser.openURL('http://sibling.com', { targetId: 'split-tab' });
      const target = await openTab('http://target.com');
      const targetSibling = await browser.openURL('http://target2.com', { targetId: 'split-tab' });

      browser.moveTabToPosition(sibling!.tab.id, {
        kind: 'after-tab',
        targetTabId: targetSibling!.tab.id,
      });

      expect(tabIds(target.tabContainer)).toEqual([
        target.tab.id,
        targetSibling!.tab.id,
        sibling!.tab.id,
      ]);
      expect(tabIds(source.tabContainer)).toEqual([source.tab.id]);
    });

    test('promotes a child container holding a single tab when it moves to a top-level position', async () => {
      const parent = await openTab('http://parent.com');
      const child = await openTab('http://child.com', parent.tabContainer);
      const target = await openTab('http://target.com');
      const childId = child.tabContainer.id;

      browser.moveTabToPosition(child.tab.id, {
        kind: 'before-tab',
        targetTabId: target.tab.id,
      });

      expect(parent.tabContainer.children).toHaveLength(0);
      expect(child.tabContainer.parent).toBeNull();
      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
        parent.tabContainer.id,
        childId,
        target.tabContainer.id,
      ]);
    });

    test('prunes an emptied child container when its tab moves to another container', async () => {
      const parent = await openTab('http://parent.com');
      const child = await openTab('http://child.com', parent.tabContainer);
      const childSibling = await browser.openURL('http://child2.com', { targetId: 'split-tab' });
      const target = await openTab('http://target.com');

      browser.moveTabToPosition(childSibling!.tab.id, {
        kind: 'before-tab',
        targetTabId: target.tab.id,
      });

      expect(parent.tabContainer.children.map((c) => c.id)).toEqual([child.tabContainer.id]);
      expect(browser.getTab(childSibling!.tab.id)?.tabContainer.id).toBe(target.tabContainer.id);
      expect(tabIds(child.tabContainer)).toEqual([child.tab.id]);
    });

    test('moves the whole container when the dragged tab is the only one it holds', async () => {
      const source = await openTab('http://source.com');
      const target = await openTab('http://target.com');
      const sourceId = source.tabContainer.id;
      const targetId = target.tabContainer.id;

      browser.moveTabToPosition(source.tab.id, {
        kind: 'before-tab',
        targetTabId: target.tab.id,
      });

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([sourceId, targetId]);
      expect(browser.getTab(source.tab.id)?.tabContainer.id).toBe(sourceId);
    });

    test('moves the whole container after the target container', async () => {
      const first = await openTab('http://first.com');
      const source = await openTab('http://source.com');
      const target = await openTab('http://target.com');
      const sourceId = source.tabContainer.id;

      browser.moveTabToPosition(source.tab.id, {
        kind: 'after-tab',
        targetTabId: target.tab.id,
      });

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
        first.tabContainer.id,
        target.tabContainer.id,
        sourceId,
      ]);
    });
  });

  describe('as-child', () => {
    test('places the tab inside a new child of the target root container', async () => {
      const source = await openTab('http://source.com');
      const parent = await openTab('http://parent.com');

      browser.moveTabToPosition(source.tab.id, {
        kind: 'as-child',
        targetTabId: parent.tab.id,
      });

      const moved = browser.getTab(source.tab.id)!;
      expect(moved.tabContainer.parent?.id).toBe(parent.tabContainer.id);
      expect(moved.tabContainer.tabs.map((t) => t.id)).toEqual([source.tab.id]);
      expect(parent.tabContainer.children.map((c) => c.id)).toEqual([moved.tabContainer.id]);
    });

    test('removes the source container when it ends up empty', async () => {
      const source = await openTab('http://source.com');
      const parent = await openTab('http://parent.com');

      browser.moveTabToPosition(source.tab.id, {
        kind: 'as-child',
        targetTabId: parent.tab.id,
      });

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([parent.tabContainer.id]);
    });
  });

  describe('out-of-container', () => {
    test('moves the tab up to the parent container', async () => {
      const parent = await openTab('http://parent.com');
      const child = await openTab('http://child.com', parent.tabContainer);

      browser.moveTabToPosition(child.tab.id, {
        kind: 'out-of-container',
        targetTabContainerId: child.tabContainer.id,
      });

      expect(tabIds(parent.tabContainer)).toEqual([parent.tab.id, child.tab.id]);
      expect(parent.tabContainer.children).toHaveLength(0);
      expect(browser.getTab(child.tab.id)?.tabContainer.id).toBe(parent.tabContainer.id);
    });

    test('removes the child container from the tree', async () => {
      const parent = await openTab('http://parent.com');
      const child = await openTab('http://child.com', parent.tabContainer);

      browser.moveTabToPosition(child.tab.id, {
        kind: 'out-of-container',
        targetTabContainerId: child.tabContainer.id,
      });

      expect(parent.tabContainer.children).toHaveLength(0);
      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([parent.tabContainer.id]);
    });

    test('a top-level container falls back to the desktop root', async () => {
      const source = await openTab('http://source.com');
      const other = await openTab('http://other.com');

      browser.moveTabToPosition(source.tab.id, {
        kind: 'out-of-container',
        targetTabContainerId: source.tabContainer.id,
      });

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
        other.tabContainer.id,
        source.tabContainer.id,
      ]);
    });
  });

  describe('desktop', () => {
    test('moves the tab to a new top-level container at the end of the desktop', async () => {
      const source = await openTab('http://source.com');
      const sibling = await browser.openURL('http://sibling.com', { targetId: 'split-tab' });
      const other = await openTab('http://other.com');

      browser.moveTabToPosition(sibling!.tab.id, { kind: 'desktop' });

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
        source.tabContainer.id,
        other.tabContainer.id,
        expect.any(Number),
      ]);
      expect(browser.getTab(sibling!.tab.id)?.tabContainer.parent).toBeNull();
    });

    test('moves the whole container to the end of the desktop when it holds a single tab', async () => {
      const first = await openTab('http://first.com');
      const source = await openTab('http://source.com');

      browser.moveTabToPosition(source.tab.id, { kind: 'desktop' });

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
        first.tabContainer.id,
        source.tabContainer.id,
      ]);
    });

    test('does nothing when the tab already lives in a top-level container', async () => {
      const source = await openTab('http://source.com');

      browser.moveTabToPosition(source.tab.id, { kind: 'desktop' });

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([source.tabContainer.id]);
      expect(tabIds(source.tabContainer)).toEqual([source.tab.id]);
    });
  });

  describe('invalid input', () => {
    test('an unknown tab id is ignored', () => {
      expect(() => browser.moveTabToPosition(9999, { kind: 'desktop' })).not.toThrow();
    });

    test('an unknown target tab is ignored', async () => {
      const a = await openTab('http://a.com');

      browser.moveTabToPosition(a.tab.id, { kind: 'before-tab', targetTabId: 9999 });

      expect(tabIds(a.tabContainer)).toEqual([a.tab.id]);
    });

    test('an unknown target container is ignored', async () => {
      const a = await openTab('http://a.com');

      browser.moveTabToPosition(a.tab.id, {
        kind: 'out-of-container',
        targetTabContainerId: 9999,
      });

      expect(tabIds(a.tabContainer)).toEqual([a.tab.id]);
    });
  });
});
