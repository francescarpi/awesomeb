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
