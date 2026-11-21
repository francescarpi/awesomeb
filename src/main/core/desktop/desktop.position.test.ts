import { expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions, Window, Desktop, TabContainer } from '@/core';

describe('Desktop.moveTabContainerToIndex', () => {
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

  function addContainers(count: number): TabContainer[] {
    const containers: TabContainer[] = [];
    for (let i = 0; i < count; i++) {
      containers.push(desktop.createTabContainer(browser.idGenerator.nextTabContainerId));
    }
    return containers;
  }

  test('returns false for an unknown container', () => {
    addContainers(1);
    expect(desktop.moveTabContainerToIndex(9999, 0)).toBe(false);
  });

  test('moves a top-level container to the requested index', () => {
    const [a, b, c] = addContainers(3);

    expect(desktop.moveTabContainerToIndex(c!.id, 0)).toBe(true);

    expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([c!.id, a!.id, b!.id]);
  });

  test('returns false when the container is already at that index', () => {
    const [a, b] = addContainers(2);

    expect(desktop.moveTabContainerToIndex(b!.id, 1)).toBe(false);
    expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([a!.id, b!.id]);
  });

  test('clamps an index beyond the end', () => {
    const [a, b, c] = addContainers(3);

    expect(desktop.moveTabContainerToIndex(a!.id, 99)).toBe(true);

    expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([b!.id, c!.id, a!.id]);
  });

  test('moves a child container within its parent', () => {
    const parent = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const first = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const second = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const third = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);

    expect(desktop.moveTabContainerToIndex(third.id, 0)).toBe(true);

    expect(parent.children.map((tc) => tc.id)).toEqual([third.id, first.id, second.id]);
    expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([parent.id]);
  });

  test('a top-level move does not affect the children of a container', () => {
    const parent = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const child = parent.createChildTabContainer(browser.idGenerator.nextTabContainerId);
    const other = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);

    desktop.moveTabContainerToIndex(other.id, 0);

    expect(parent.children.map((tc) => tc.id)).toEqual([child.id]);
    expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([other.id, parent.id]);
  });
});
