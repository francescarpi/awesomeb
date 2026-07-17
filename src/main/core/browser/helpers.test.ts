import { expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions } from '@/core';

describe('parseTarget - justAfter positioning', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
  });

  test("'after-current' without parent places new tabContainer right after selectedTab.tabContainer", async () => {
    browser.createWindow(1, { withDesktops: true });
    const desktop = browser.activeWindow!.selectedDesktop;

    const first = await browser.openURL('http://a.com');
    expect(first).not.toBeNull();
    const selectedId = first!.tabContainer.id;

    const second = await browser.openURL('http://b.com', {
      targetId: 'after-current',
      selectTab: false,
    });
    expect(second).not.toBeNull();

    expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([selectedId, second!.tabContainer.id]);
  });

  test('parentTabContainer attaches the new container as a child of the given parent', async () => {
    browser.createWindow(1, { withDesktops: true });
    const desktop = browser.activeWindow!.selectedDesktop;

    const parent = await browser.openURL('http://parent.com');
    expect(parent).not.toBeNull();

    const child = await browser.openURL('http://child.com', {
      parentTabContainer: parent!.tabContainer,
    });
    expect(child).not.toBeNull();

    expect(child!.tabContainer.parent).toBe(parent!.tabContainer);
    expect(parent!.tabContainer.children).toContain(child!.tabContainer);
    expect(desktop.tabContainers).toContain(parent!.tabContainer);
    expect(desktop.tabContainers).not.toContain(child!.tabContainer);
  });

  test('parentTabContainer with 2 children preserves sibling order in parent.children', async () => {
    browser.createWindow(1, { withDesktops: true });

    const parent = await browser.openURL('http://parent.com');
    const firstChild = await browser.openURL('http://child1.com', {
      parentTabContainer: parent!.tabContainer,
    });
    const secondChild = await browser.openURL('http://child2.com', {
      parentTabContainer: parent!.tabContainer,
    });

    expect(parent!.tabContainer.children.map((tc) => tc.id)).toEqual([
      firstChild!.tabContainer.id,
      secondChild!.tabContainer.id,
    ]);
  });

  test('parentTabContainer with 3+ children keeps insertion order in parent.children', async () => {
    browser.createWindow(1, { withDesktops: true });

    const parent = await browser.openURL('http://parent.com');
    const c1 = await browser.openURL('http://c1.com', {
      parentTabContainer: parent!.tabContainer,
    });
    const c2 = await browser.openURL('http://c2.com', {
      parentTabContainer: parent!.tabContainer,
    });
    const c3 = await browser.openURL('http://c3.com', {
      parentTabContainer: parent!.tabContainer,
    });

    expect(parent!.tabContainer.children.map((tc) => tc.id)).toEqual([
      c1!.tabContainer.id,
      c2!.tabContainer.id,
      c3!.tabContainer.id,
    ]);
  });

  test('without after-current and without parent, tabContainer is appended at the end of the desktop', async () => {
    browser.createWindow(1, { withDesktops: true });
    const desktop = browser.activeWindow!.selectedDesktop;

    const a = await browser.openURL('http://a.com');
    const b = await browser.openURL('http://b.com');
    const c = await browser.openURL('http://c.com');

    expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
      a!.tabContainer.id,
      b!.tabContainer.id,
      c!.tabContainer.id,
    ]);
  });

  test('precedence: parentTabContainer wins over after-current when both are provided', async () => {
    browser.createWindow(1, { withDesktops: true });
    const desktop = browser.activeWindow!.selectedDesktop;

    const parent = await browser.openURL('http://parent.com');
    expect(parent).not.toBeNull();

    const existing = await browser.openURL('http://existing.com');
    expect(existing).not.toBeNull();

    const newChild = await browser.openURL('http://newchild.com', {
      targetId: 'after-current',
      parentTabContainer: parent!.tabContainer,
    });
    expect(newChild).not.toBeNull();

    expect(newChild!.tabContainer.parent).toBe(parent!.tabContainer);
    expect(parent!.tabContainer.children).toContain(newChild!.tabContainer);
    expect(desktop.tabContainers).not.toContain(newChild!.tabContainer);
  });
});
