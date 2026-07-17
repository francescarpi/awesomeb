import { expect, test, describe, beforeEach, vi } from 'vitest';
import type { TTabContainerId } from '~/types';
import { Browser, partitions, Window, TabContainer } from '@/core';

describe('Desktop', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('rename desktop works correctly', () => {
    const d = window.getDesktop(2)!;
    expect(d.label).toBe('2: Unnamed');

    d.setName('Wrk', 'Work');
    expect(d.label).toBe('2: Work');
  });

  test('setName: trims whitespace from both fields', () => {
    const d = window.getDesktop(2)!;
    d.setName('  Wrk  ', '  Work  ');
    expect(d.shortName).toBe('Wrk');
    expect(d.longName).toBe('Work');
  });

  test('setName: clearing shortName also clears longName (intentional UX)', () => {
    const d = window.getDesktop(2)!;
    d.setName('Wrk', 'Work');
    d.setName('', 'Work');
    expect(d.shortName).toBeNull();
    expect(d.longName).toBeNull();
  });

  test('setName: clearing longName also clears shortName (intentional UX)', () => {
    const d = window.getDesktop(2)!;
    d.setName('Wrk', 'Work');
    d.setName('Wrk', '');
    expect(d.shortName).toBeNull();
    expect(d.longName).toBeNull();
  });

  test('setName: clearing both sets both to null', () => {
    const d = window.getDesktop(2)!;
    d.setName('Wrk', 'Work');
    d.setName('', '');
    expect(d.shortName).toBeNull();
    expect(d.longName).toBeNull();
  });

  test('setName: same value twice emits event only once (no-op second call)', () => {
    const d = window.getDesktop(2)!;
    const emitSpy = vi.spyOn(d.browser.eventsChannel, 'emit');
    d.setName('Wrk', 'Work');
    emitSpy.mockClear();
    d.setName('Wrk', 'Work');
    expect(emitSpy).not.toHaveBeenCalledWith('desktop:name-did-change', expect.anything(), d);
  });

  test('setName: emits desktop:name-did-change event', () => {
    const d = window.getDesktop(2)!;
    const emitSpy = vi.spyOn(d.browser.eventsChannel, 'emit');
    d.setName('Wrk', 'Work');
    expect(emitSpy).toHaveBeenCalledWith('desktop:name-did-change', d.window, d);
  });

  test('move tabcontainer up and down works correctly', () => {
    const d = window.getDesktop(2)!;
    const tc1 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const tc2 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const tc3 = d.createTabContainer(browser.idGenerator.nextTabContainerId);

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc2.id, tc3.id]);

    // Move tc2 up
    d.moveTabContainer(tc2.id, 'up');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc2.id, tc1.id, tc3.id]);

    // Move tc2 up again (should do nothing)
    d.moveTabContainer(tc2.id, 'up');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc2.id, tc1.id, tc3.id]);

    // Move tc2 down
    d.moveTabContainer(tc2.id, 'down');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc2.id, tc3.id]);

    // Move tc2 down again
    d.moveTabContainer(tc2.id, 'down');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc3.id, tc2.id]);

    // Move tc2 down again (should do nothing)
    d.moveTabContainer(tc2.id, 'down');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc3.id, tc2.id]);
  });

  test('move tabcontainers having closed tabs works has expected', async () => {
    const d = window.selectedDesktop;

    const t1 = await browser.openURL('http://example1.com');
    const t2 = await browser.openURL('http://example2.com');
    const t3 = await browser.openURL('http://example3.com');

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      t1!.tabContainer.id,
      t2!.tabContainer.id,
      t3!.tabContainer.id,
    ]);

    browser.closeTab(t2!.tab.id);
    expect(t2?.tabContainer.isClosed).toBeTruthy();

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      t1!.tabContainer.id,
      t2!.tabContainer.id,
      t3!.tabContainer.id,
    ]);

    d.moveTabContainer(t3!.tabContainer.id, 'up');

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      t3!.tabContainer.id,
      t1!.tabContainer.id,
      t2!.tabContainer.id,
    ]);

    d.moveTabContainer(t3!.tabContainer.id, 'down');

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      t1!.tabContainer.id,
      t3!.tabContainer.id,
      t2!.tabContainer.id,
    ]);
  });

  test('getTabsBelow returns correct tabs', async () => {
    const d = window.selectedDesktop;

    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    const tab1 = result1!.tab;
    const tab2 = result2!.tab;
    const tab3 = result3!.tab;

    const tabsBelowTab1 = d.getTabsBelow(tab1.id);
    expect(tabsBelowTab1.map((t) => t.tab.id)).toEqual([tab2.id, tab3.id]);

    const tabsBelowTab2 = d.getTabsBelow(tab2.id);
    expect(tabsBelowTab2.map((t) => t.tab.id)).toEqual([tab3.id]);

    const tabsBelowTab3 = d.getTabsBelow(tab3.id);
    expect(tabsBelowTab3.map((t) => t.tab.id)).toEqual([]);
  });

  test('addTabContainer with justAfter inserts tab container in specified position', () => {
    const d = window.getDesktop(2)!;

    const tc1 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const tc2 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const tc3 = d.createTabContainer(browser.idGenerator.nextTabContainerId);

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc2.id, tc3.id]);

    const tc4 = d.createTabContainer(browser.idGenerator.nextTabContainerId, {
      justAfter: tc1.id,
    });
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc4.id, tc2.id, tc3.id]);

    const tc5 = d.createTabContainer(browser.idGenerator.nextTabContainerId, {
      justAfter: tc3.id,
    });
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc4.id, tc2.id, tc3.id, tc5.id]);

    const tc6 = d.createTabContainer(browser.idGenerator.nextTabContainerId, {
      justAfter: -1 as TTabContainerId,
    });
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      tc1.id,
      tc4.id,
      tc2.id,
      tc3.id,
      tc5.id,
      tc6.id,
    ]);
  });
  test('tabs includes child container tabs', async () => {
    const d = window.selectedDesktop;
    const parent = await browser.openURL('http://parent.com');
    const child = await browser.openURL('http://child.com', {
      parentTabContainer: parent!.tabContainer,
    });

    const tabIds = d.tabs.map((t) => t.tab.id);

    expect(tabIds).toContain(parent!.tab.id);
    expect(tabIds).toContain(child!.tab.id);
    expect(d.tabs.length).toBe(2);
  });

  test('tabs includes tabs from multiple child containers under the same parent', async () => {
    const d = window.selectedDesktop;
    const parent = await browser.openURL('http://parent.com');
    const c1 = await browser.openURL('http://c1.com', { parentTabContainer: parent!.tabContainer });
    const c2 = await browser.openURL('http://c2.com', { parentTabContainer: parent!.tabContainer });

    const tabIds = d.tabs.map((t) => t.tab.id);

    expect(tabIds).toContain(parent!.tab.id);
    expect(tabIds).toContain(c1!.tab.id);
    expect(tabIds).toContain(c2!.tab.id);
    expect(d.tabs.length).toBe(3);
  });

  test('tabs: child container tabs reference the child as tabContainer, not the parent', async () => {
    const d = window.selectedDesktop;
    const parent = await browser.openURL('http://parent.com');
    const child = await browser.openURL('http://child.com', {
      parentTabContainer: parent!.tabContainer,
    });

    const childEntry = d.tabs.find((t) => t.tab.id === child!.tab.id);

    expect(childEntry).toBeDefined();
    expect(childEntry!.tabContainer.id).toBe(child!.tabContainer.id);
    expect(childEntry!.tabContainer.parent).toBe(parent!.tabContainer);
  });

  test('getTabsBelow includes child container tabs in DFS pre-order', async () => {
    const d = window.selectedDesktop;
    const parent = await browser.openURL('http://parent.com');
    const child = await browser.openURL('http://child.com', {
      parentTabContainer: parent!.tabContainer,
    });
    const nextParent = await browser.openURL('http://next.com');

    // DFS pre-order: parent.tab → child.tab → nextParent.tab
    const belowParent = d.getTabsBelow(parent!.tab.id);
    expect(belowParent.map((t) => t.tab.id)).toEqual([child!.tab.id, nextParent!.tab.id]);
  });

  test('getTabsBelow from a child tab sees tabs in subsequent children and next parent', async () => {
    const d = window.selectedDesktop;
    const parent = await browser.openURL('http://parent.com');
    const c1 = await browser.openURL('http://c1.com', { parentTabContainer: parent!.tabContainer });
    const c2 = await browser.openURL('http://c2.com', { parentTabContainer: parent!.tabContainer });
    const nextParent = await browser.openURL('http://next.com');

    // DFS pre-order: parent.tab → c1.tab → c2.tab → nextParent.tab
    const belowC1 = d.getTabsBelow(c1!.tab.id);
    expect(belowC1.map((t) => t.tab.id)).toEqual([c2!.tab.id, nextParent!.tab.id]);
  });

  test('getTabsBelow from the last child returns nothing when there is no next parent', async () => {
    const d = window.selectedDesktop;
    const parent = await browser.openURL('http://parent.com');
    const child = await browser.openURL('http://child.com', {
      parentTabContainer: parent!.tabContainer,
    });

    const belowChild = d.getTabsBelow(child!.tab.id);
    expect(belowChild).toEqual([]);
  });

  test('tabs: top-level container with no parent or children works as before (regression)', () => {
    const d = window.selectedDesktop;
    const tc = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const tab = tc.createTab(browser.idGenerator.nextTabId, {
      partition: partitions.default,
      url: 'http://example.com',
    });

    const result = d.tabs;

    expect(result.length).toBe(1);
    expect(result[0].tab.id).toBe(tab.id);
    expect(result[0].tabContainer.id).toBe(tc.id);
  });
});

describe('Desktop.selectTabContainer (children reachable)', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('selectTabContainer with a top-level id sets and exposes it', () => {
    const d = window.selectedDesktop;
    const tc = d.createTabContainer(browser.idGenerator.nextTabContainerId);

    d.selectTabContainer(tc.id);

    expect(d.selectedTabContainer).toBe(tc);
  });

  test('selectTabContainer with a direct child id sets and exposes it', () => {
    const d = window.selectedDesktop;
    const parent = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const child = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    d.selectTabContainer(child.id);

    expect(d.selectedTabContainer).toBe(child);
  });

  test('selectTabContainer with a grandchild id (3-level tree) sets and exposes it', () => {
    const d = window.selectedDesktop;
    const root = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const mid = root.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const leaf = mid.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    d.selectTabContainer(leaf.id);

    expect(d.selectedTabContainer).toBe(leaf);
  });

  test('selectTabContainer with a non-existent id is a no-op (previous selection is preserved)', () => {
    const d = window.selectedDesktop;
    const tc = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    d.selectTabContainer(tc.id);

    d.selectTabContainer(99999 as TTabContainerId);

    expect(d.selectedTabContainer).toBe(tc);
  });

  test('selectTabContainer(null) clears the selection even when a child exists', () => {
    const d = window.selectedDesktop;
    const parent = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const child = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    d.selectTabContainer(child.id);
    expect(d.selectedTabContainer).toBe(child);

    d.selectTabContainer(null);
    expect(d.selectedTabContainer).toBeNull();
  });

  test('selectedTabContainer resolves a previously-set child id (not just top-level)', () => {
    const d = window.selectedDesktop;
    const parent = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const child = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    d.selectTabContainer(child.id);
    const resolved = d.selectedTabContainer;

    expect(resolved).toBeInstanceOf(TabContainer);
    expect(resolved?.id).toBe(child.id);
    expect(resolved?.parent).toBe(parent);
  });
});

describe('Desktop.moveTabContainer (children)', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('moveTabContainer with a child id moves it within parent.children', () => {
    const d = window.selectedDesktop;
    const parent = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const c1 = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const c2 = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const c3 = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    d.moveTabContainer(c2.id, 'up');

    expect(parent.children.map((c) => c.id)).toEqual([c2.id, c1.id, c3.id]);
  });

  test('moveTabContainer with a child id does not change desktop.tabContainers', () => {
    const d = window.selectedDesktop;
    const t1 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const t2 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const child = t1.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    const before = d.tabContainers.map((tc) => tc.id);
    d.moveTabContainer(child.id, 'down');
    const after = d.tabContainers.map((tc) => tc.id);

    expect(after).toEqual(before);
    expect(after).toEqual([t1.id, t2.id]);
    expect(t1.children[0].id).toBe(child.id);
  });

  test('moveTabContainer with a child at first position is a no-op', () => {
    const d = window.selectedDesktop;
    const parent = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const c1 = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const c2 = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    d.moveTabContainer(c1.id, 'up');

    expect(parent.children.map((c) => c.id)).toEqual([c1.id, c2.id]);
  });

  test('moveTabContainer with a child at last position is a no-op', () => {
    const d = window.selectedDesktop;
    const parent = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const c1 = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const c2 = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    d.moveTabContainer(c2.id, 'down');

    expect(parent.children.map((c) => c.id)).toEqual([c1.id, c2.id]);
  });

  test('moveTabContainer emits desktop:tabcontainers-order-did-change only when a child move was effective', () => {
    const d = window.selectedDesktop;
    const parent = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const c2 = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    const emitSpy = vi.spyOn(d.browser.eventsChannel, 'emit');

    // Effective move: c2 up → swap with c1. Event fires.
    d.moveTabContainer(c2.id, 'up');
    expect(emitSpy).toHaveBeenCalledWith('desktop:tabcontainers-order-did-change', d.window, d);

    // No-op move: c2 is now at first position, "up" does nothing. Event does NOT fire.
    emitSpy.mockClear();
    d.moveTabContainer(c2.id, 'up');
    expect(emitSpy).not.toHaveBeenCalledWith(
      'desktop:tabcontainers-order-did-change',
      expect.anything(),
      expect.anything(),
    );
  });
});
