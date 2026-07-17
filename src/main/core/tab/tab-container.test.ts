import { expect, test, describe, beforeEach, vi } from 'vitest';
import { Browser, partitions, Window, Desktop, TabContainer } from '@/core';

describe('TabContainer.parent', () => {
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

  test('defaults to null on a newly created container', () => {
    expect(tc.parent).toBeNull();
  });

  test('stays null after adding tabs to the browser (unrelated container is untouched)', async () => {
    await browser.openURL('http://example.com');
    expect(tc.parent).toBeNull();
  });

  test('setParent(other) makes parent reference the other container', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tc.setParent(other);
    expect(tc.parent).toBe(other);
  });

  test('setParent(null) reverts to null (unparent case)', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tc.setParent(other);
    expect(tc.parent).toBe(other);

    tc.setParent(null);
    expect(tc.parent).toBeNull();
  });

  test('calling setParent twice with different values reflects the latest', () => {
    const first = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const second = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    tc.setParent(first);
    tc.setParent(second);

    expect(tc.parent).toBe(second);
  });

  test('setParent does not emit any event on the browser eventsChannel', () => {
    const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    tc.setParent(other);

    const tabcontainerEvents = emitSpy.mock.calls.filter((call) => {
      const channel = call[0];
      return typeof channel === 'string' && channel.startsWith('tabcontainer:');
    });
    expect(tabcontainerEvents).toEqual([]);
  });
});

describe('TabContainer.addChild / TabContainer.children', () => {
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

  test('children is an empty array on a new container', () => {
    expect(tc.children).toEqual([]);
    expect(tc.children).not.toBeNull();
    expect(tc.children).not.toBeUndefined();
  });

  test('addChild(other) makes children include other', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tc.addChild(other);
    expect(tc.children).toContain(other);
    expect(tc.children.length).toBe(1);
  });

  test('adding two distinct children yields length 2', () => {
    const first = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const second = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    tc.addChild(first);
    tc.addChild(second);

    expect(tc.children.length).toBe(2);
    expect(tc.children).toEqual([first, second]);
  });

  test('adding the same child twice does not duplicate (Map.set semantics)', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    tc.addChild(other);
    tc.addChild(other);

    expect(tc.children.length).toBe(1);
    expect(tc.children[0]).toBe(other);
  });

  test('addChild does NOT set the parent on the child (decoupled contract)', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tc.addChild(other);

    expect(other.parent).toBeNull();
  });

  test('children preserves insertion order', () => {
    const first = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const second = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const third = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    tc.addChild(first);
    tc.addChild(second);
    tc.addChild(third);

    expect(tc.children).toEqual([first, second, third]);
  });

  test('children returns a copy: mutating the returned array does not affect internal state', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tc.addChild(other);

    const snapshot = tc.children;
    snapshot.push(desktop.createTabContainer(browser.idGenerator.nextTabContainerId));

    expect(tc.children.length).toBe(1);
  });

  test('addChild does not emit any event on the browser eventsChannel', () => {
    const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    tc.addChild(other);

    const tabcontainerEvents = emitSpy.mock.calls.filter((call) => {
      const channel = call[0];
      return typeof channel === 'string' && channel.startsWith('tabcontainer:');
    });
    expect(tabcontainerEvents).toEqual([]);
  });
});

describe('TabContainer.removeChild', () => {
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

  test('removes the matching child from the parent children list', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tc.addChild(other);
    expect(tc.children).toContain(other);

    tc.removeChild(other.id);

    expect(tc.children).not.toContain(other);
    expect(tc.children).toEqual([]);
  });

  test('calling removeChild twice with the same id is a no-op the second time', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tc.addChild(other);

    tc.removeChild(other.id);
    expect(tc.children.length).toBe(0);

    expect(() => tc.removeChild(other.id)).not.toThrow();
    expect(tc.children.length).toBe(0);
  });

  test('removeChild with a non-existent id is a no-op (does not throw, does not mutate)', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tc.addChild(other);

    expect(() => tc.removeChild(99999 as any)).not.toThrow();
    expect(tc.children.length).toBe(1);
    expect(tc.children[0]).toBe(other);
  });

  test('removeChild does NOT clear the parent reference on the removed child (decoupled contract)', () => {
    const parent = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const child = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    parent.addChild(child);
    child.setParent(parent);

    expect(child.parent).toBe(parent);

    parent.removeChild(child.id);

    expect(parent.children).not.toContain(child);
    expect(child.parent).toBe(parent);
  });

  test('removeChild does not affect siblings', () => {
    const first = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const second = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const third = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    tc.addChild(first);
    tc.addChild(second);
    tc.addChild(third);

    tc.removeChild(second.id);

    expect(tc.children).toEqual([first, third]);
    expect(tc.children).toContain(first);
    expect(tc.children).toContain(third);
    expect(tc.children).not.toContain(second);
  });

  test('removeChild does not emit any event on the browser eventsChannel', () => {
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    tc.addChild(other);

    const emitSpy = vi.spyOn(browser.eventsChannel, 'emit');

    tc.removeChild(other.id);

    const tabcontainerEvents = emitSpy.mock.calls.filter((call) => {
      const channel = call[0];
      return typeof channel === 'string' && channel.startsWith('tabcontainer:');
    });
    expect(tabcontainerEvents).toEqual([]);
  });
});

describe('TabContainer tree (parent + children together)', () => {
  let browser: Browser;
  let window: Window;
  let desktop: Desktop;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
    desktop = window.selectedDesktop;
  });

  test('a container can be a parent and a child at the same time (N-ary tree)', () => {
    const root = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const mid = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const leaf = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    root.addChild(mid);
    mid.setParent(root);
    mid.addChild(leaf);
    leaf.setParent(mid);

    expect(root.children).toEqual([mid]);
    expect(mid.parent).toBe(root);
    expect(mid.children).toEqual([leaf]);
    expect(leaf.parent).toBe(mid);
    expect(root.children[0].children[0]).toBe(leaf);
  });

  test('two distinct parents can hold the same child (no anti-duplication enforcement)', () => {
    const parentA = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const parentB = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const shared = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    parentA.addChild(shared);
    parentB.addChild(shared);

    expect(parentA.children).toContain(shared);
    expect(parentB.children).toContain(shared);
    expect(shared.parent).toBeNull();
  });

  test('documents the decoupled contract: addChild without setParent leaves the graph inconsistent', () => {
    const root = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const child = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    root.addChild(child);

    expect(root.children).toContain(child);
    expect(child.parent).toBeNull();

    // This test intentionally documents the current contract. If a future
    // attachChild() atomic helper is added, this test must be revisited:
    // the relationship should be set on both sides in a single call.
  });
});

describe('TabContainer.moveChild', () => {
  let browser: Browser;
  let desktop: Desktop;
  let parent: TabContainer;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    const window = browser.createWindow(1);
    window.createDefaultDesktops();
    desktop = window.selectedDesktop;
    parent = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
  });

  function makeChild(): TabContainer {
    return parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
  }

  test('moveChild up reorders children within parent.children', () => {
    const c1 = makeChild();
    const c2 = makeChild();
    const c3 = makeChild();
    expect(parent.children.map((c) => c.id)).toEqual([c1.id, c2.id, c3.id]);

    const moved = parent.moveChild(c2.id, 'up');
    expect(moved).toBe(true);
    expect(parent.children.map((c) => c.id)).toEqual([c2.id, c1.id, c3.id]);
  });

  test('moveChild down reorders children within parent.children', () => {
    const c1 = makeChild();
    const c2 = makeChild();
    const c3 = makeChild();
    expect(parent.children.map((c) => c.id)).toEqual([c1.id, c2.id, c3.id]);

    const moved = parent.moveChild(c2.id, 'down');
    expect(moved).toBe(true);
    expect(parent.children.map((c) => c.id)).toEqual([c1.id, c3.id, c2.id]);
  });

  test('moveChild up at first position returns false (no-op)', () => {
    const c1 = makeChild();
    const c2 = makeChild();
    const moved = parent.moveChild(c1.id, 'up');
    expect(moved).toBe(false);
    expect(parent.children.map((c) => c.id)).toEqual([c1.id, c2.id]);
  });

  test('moveChild down at last position returns false (no-op)', () => {
    const c1 = makeChild();
    const c2 = makeChild();
    const moved = parent.moveChild(c2.id, 'down');
    expect(moved).toBe(false);
    expect(parent.children.map((c) => c.id)).toEqual([c1.id, c2.id]);
  });

  test('moveChild with unknown id returns false (no-op)', () => {
    makeChild();
    const moved = parent.moveChild(99999 as never, 'up');
    expect(moved).toBe(false);
  });
});

describe('TabContainer.hasChildren', () => {
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

  function makeChildContainer(): TabContainer {
    return parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
  }

  function makeChildWithTab(): TabContainer {
    const child = makeChildContainer();
    child.createTab(browser.idGenerator.nextTabId, {
      partition: partitions.default,
      url: 'http://example.com',
    });
    return child;
  }

  test('returns false on a new container with no children', () => {
    expect(parent.hasChildren).toBe(false);
  });

  test('returns true when at least one child has non-closed tabs', () => {
    makeChildWithTab();
    expect(parent.hasChildren).toBe(true);
  });

  test('returns true when at least one child has no tabs yet (empty container is not closed)', () => {
    makeChildContainer();
    expect(parent.hasChildren).toBe(true);
  });

  test('returns false when all children are closed', () => {
    const child = makeChildWithTab();
    for (const tab of child.tabs) {
      tab.markAsClosed();
    }
    expect(child.isClosed).toBe(true);
    expect(parent.hasChildren).toBe(false);
  });

  test('returns true when some children are closed and some are open', () => {
    const closed = makeChildWithTab();
    for (const tab of closed.tabs) {
      tab.markAsClosed();
    }
    makeChildWithTab();
    expect(parent.hasChildren).toBe(true);
  });

  test('returns false after all open children are closed', () => {
    const child = makeChildWithTab();
    expect(parent.hasChildren).toBe(true);

    for (const tab of child.tabs) {
      tab.markAsClosed();
    }
    expect(parent.hasChildren).toBe(false);
  });

  test('returns false after the last open child is removed', () => {
    const child = makeChildWithTab();
    expect(parent.hasChildren).toBe(true);

    parent.removeChild(child.id);
    expect(parent.hasChildren).toBe(false);
  });
});

describe('TabContainer.ownAndChildTabs', () => {
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

  test('returns only own tabs when there are no children', () => {
    const tab = tc.createTab(browser.idGenerator.nextTabId, {
      partition: partitions.default,
      url: 'http://example.com',
    });

    const result = tc.ownAndChildTabs;

    expect(result.length).toBe(1);
    expect(result[0].tab.id).toBe(tab.id);
    expect(result[0].tabContainer).toBe(tc);
  });

  test('returns own tabs first, then child tabs in insertion order', () => {
    const ownTab = tc.createTab(browser.idGenerator.nextTabId, {
      partition: partitions.default,
      url: 'http://own.com',
    });
    const c1 = tc.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const c1Tab = c1.createTab(browser.idGenerator.nextTabId, {
      partition: partitions.default,
      url: 'http://c1.com',
    });
    const c2 = tc.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const c2Tab = c2.createTab(browser.idGenerator.nextTabId, {
      partition: partitions.default,
      url: 'http://c2.com',
    });

    const result = tc.ownAndChildTabs;

    expect(result.map((e) => e.tab.id)).toEqual([ownTab.id, c1Tab.id, c2Tab.id]);
  });

  test('child tab entries reference the child as tabContainer', () => {
    tc.createTab(browser.idGenerator.nextTabId, {
      partition: partitions.default,
      url: 'http://own.com',
    });
    const child = tc.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const childTab = child.createTab(browser.idGenerator.nextTabId, {
      partition: partitions.default,
      url: 'http://child.com',
    });

    const childEntry = tc.ownAndChildTabs.find((e) => e.tab.id === childTab.id);

    expect(childEntry).toBeDefined();
    expect(childEntry!.tabContainer.id).toBe(child.id);
  });

  test('container with no own tabs but children: returns only child tabs', () => {
    const child = tc.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const childTab = child.createTab(browser.idGenerator.nextTabId, {
      partition: partitions.default,
      url: 'http://child.com',
    });

    const result = tc.ownAndChildTabs;

    expect(result.length).toBe(1);
    expect(result[0].tab.id).toBe(childTab.id);
    expect(result[0].tabContainer.id).toBe(child.id);
  });

  test('empty container with no tabs or children returns empty array', () => {
    expect(tc.ownAndChildTabs).toEqual([]);
  });
});
