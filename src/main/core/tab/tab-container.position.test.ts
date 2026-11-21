import { expect, test, describe, beforeEach, vi } from 'vitest';
import { Browser, partitions, Window, Desktop, Tab, TabContainer } from '@/core';

describe('TabContainer.moveTabToIndex', () => {
  let browser: Browser;
  let window: Window;
  let desktop: Desktop;
  let tc: TabContainer;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
    desktop = window.selectedDesktop;
    tc = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
  });

  function addTabs(count: number): Tab[] {
    const tabs: Tab[] = [];
    for (let i = 0; i < count; i++) {
      tabs.push(tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default }));
    }
    return tabs;
  }

  test('returns false for an unknown tab', () => {
    const [a] = addTabs(1);
    expect(tc.moveTabToIndex(9999, 0)).toBe(false);
    expect(tc.tabs.map((t) => t.id)).toEqual([a!.id]);
  });

  test('moves a tab to the requested index', () => {
    const [a, b, c] = addTabs(3);

    expect(tc.moveTabToIndex(c!.id, 0)).toBe(true);

    expect(tc.tabs.map((t) => t.id)).toEqual([c!.id, a!.id, b!.id]);
  });

  test('moves a tab to the last index', () => {
    const [a, b, c] = addTabs(3);

    expect(tc.moveTabToIndex(a!.id, 2)).toBe(true);

    expect(tc.tabs.map((t) => t.id)).toEqual([b!.id, c!.id, a!.id]);
  });

  test('returns false when the tab is already at that index', () => {
    const [a, b, c] = addTabs(3);

    expect(tc.moveTabToIndex(b!.id, 1)).toBe(false);
    expect(tc.tabs.map((t) => t.id)).toEqual([a!.id, b!.id, c!.id]);
  });

  test('clamps an index beyond the end to the last position', () => {
    const [a, b, c] = addTabs(3);

    expect(tc.moveTabToIndex(a!.id, 99)).toBe(true);

    expect(tc.tabs.map((t) => t.id)).toEqual([b!.id, c!.id, a!.id]);
  });

  test('clamps a negative index to the first position', () => {
    const [a, b, c] = addTabs(3);

    expect(tc.moveTabToIndex(c!.id, -5)).toBe(true);

    expect(tc.tabs.map((t) => t.id)).toEqual([c!.id, a!.id, b!.id]);
  });

  test('moving a tab down shifts the tabs in between', () => {
    const [a, b, c, d] = addTabs(4);

    expect(tc.moveTabToIndex(a!.id, 2)).toBe(true);

    expect(tc.tabs.map((t) => t.id)).toEqual([b!.id, c!.id, a!.id, d!.id]);
  });

  test('keeps the selected tab selected after the move', () => {
    const [a] = addTabs(3);
    tc.selectTab(a!.id);

    tc.moveTabToIndex(a!.id, 2);

    expect(tc.selectedTab?.id).toBe(a!.id);
  });

  test('emits tabcontainer:tabs-order-did-change', () => {
    const [a] = addTabs(2);
    const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');

    tc.moveTabToIndex(a!.id, 1);

    expect(emitSpy).toHaveBeenCalledWith('tabcontainer:tabs-order-did-change', tc);
  });

  test('does not emit the event when the order does not change', () => {
    const [, b] = addTabs(2);
    const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');

    tc.moveTabToIndex(b!.id, 1);

    expect(emitSpy).not.toHaveBeenCalledWith('tabcontainer:tabs-order-did-change', tc);
  });
});

describe('TabContainer.takeTab / insertTab', () => {
  let browser: Browser;
  let window: Window;
  let desktop: Desktop;
  let tc: TabContainer;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
    desktop = window.selectedDesktop;
    tc = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
  });

  test('takeTab removes the tab and returns it', () => {
    const tab = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });

    const taken = tc.takeTab(tab.id);

    expect(taken?.id).toBe(tab.id);
    expect(tc.tabs).toHaveLength(0);
  });

  test('takeTab returns null for an unknown tab', () => {
    expect(tc.takeTab(9999)).toBeNull();
  });

  test('takeTab clears the selection when the removed tab was selected', () => {
    const a = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });
    tc.selectTab(a.id);

    tc.takeTab(a.id);

    expect(tc.selectedTab).toBeNull();
  });

  test('insertTab appends when no index is given', () => {
    const a = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });
    const b = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });
    const c = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });

    tc.takeTab(c.id);
    tc.insertTab(c);

    expect(tc.tabs.map((t) => t.id)).toEqual([a.id, b.id, c.id]);
  });

  test('insertTab places the tab at the given index', () => {
    const a = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });
    const b = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });
    const c = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });

    tc.takeTab(a.id);
    tc.insertTab(a, 1);

    expect(tc.tabs.map((t) => t.id)).toEqual([b.id, a.id, c.id]);
  });

  test('insertTab clamps an index beyond the end', () => {
    const a = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });
    const b = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });
    const c = tc.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });

    tc.takeTab(a.id);
    tc.insertTab(a, 99);

    expect(tc.tabs.map((t) => t.id)).toEqual([b.id, c.id, a.id]);
  });
});

describe('TabContainer.moveChildToIndex', () => {
  let browser: Browser;
  let window: Window;
  let desktop: Desktop;
  let parent: TabContainer;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
    desktop = window.selectedDesktop;
    parent = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
  });

  function addChildren(count: number): TabContainer[] {
    const children: TabContainer[] = [];
    for (let i = 0; i < count; i++) {
      children.push(parent.createChildTabContainer(browser.idGenerator.nextTabContainerId));
    }
    return children;
  }

  test('returns false for an unknown child', () => {
    addChildren(1);
    expect(parent.moveChildToIndex(9999, 0)).toBe(false);
  });

  test('moves a child to the requested index', () => {
    const [a, b, c] = addChildren(3);

    expect(parent.moveChildToIndex(c!.id, 0)).toBe(true);

    expect(parent.children.map((x) => x.id)).toEqual([c!.id, a!.id, b!.id]);
  });

  test('returns false when the child is already at that index', () => {
    const [a, b] = addChildren(2);

    expect(parent.moveChildToIndex(b!.id, 1)).toBe(false);
    expect(parent.children.map((x) => x.id)).toEqual([a!.id, b!.id]);
  });

  test('clamps an index beyond the end', () => {
    const [a, b, c] = addChildren(3);

    expect(parent.moveChildToIndex(a!.id, 99)).toBe(true);

    expect(parent.children.map((x) => x.id)).toEqual([b!.id, c!.id, a!.id]);
  });

  test('does not skip closed children when computing the index', () => {
    const [a, b, c] = addChildren(3);
    b!.createTab(browser.idGenerator.nextTabId, { partition: partitions.default });

    expect(parent.moveChildToIndex(a!.id, 2)).toBe(true);

    expect(parent.children.map((x) => x.id)).toEqual([b!.id, c!.id, a!.id]);
  });
});
