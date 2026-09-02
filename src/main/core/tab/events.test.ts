import { expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions } from '@/core';
import { findOpenTabsAsChildContainer } from './events';

describe('findOpenTabsAsChildContainer', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });
  });

  test('returns undefined when tabData is null', () => {
    expect(findOpenTabsAsChildContainer(null)).toBeUndefined();
  });

  test('top-level tab without the flag returns undefined', async () => {
    const parent = await browser.openURL('http://parent.com');
    expect(findOpenTabsAsChildContainer(parent)).toBeUndefined();
  });

  test('top-level tab with the flag returns its own container', async () => {
    const parent = await browser.openURL('http://parent.com');
    parent!.tab.setOpenTabsAsChild(true);

    expect(findOpenTabsAsChildContainer(parent)).toBe(parent!.tabContainer);
  });

  test('child tab whose root ancestor has the flag returns the root container', async () => {
    const parent = await browser.openURL('http://parent.com');
    parent!.tab.setOpenTabsAsChild(true);

    const child = await browser.openURL('http://child.com', {
      parentTabContainer: parent!.tabContainer,
    });

    expect(findOpenTabsAsChildContainer(child)).toBe(parent!.tabContainer);
  });

  test('child tab whose root ancestor does NOT have the flag returns undefined', async () => {
    const parent = await browser.openURL('http://parent.com');

    const child = await browser.openURL('http://child.com', {
      parentTabContainer: parent!.tabContainer,
    });

    expect(findOpenTabsAsChildContainer(child)).toBeUndefined();
  });

  test('deeply nested tab climbs to the root ancestor with the flag', async () => {
    const root = await browser.openURL('http://root.com');
    root!.tab.setOpenTabsAsChild(true);

    const mid = await browser.openURL('http://mid.com', {
      parentTabContainer: root!.tabContainer,
    });
    const leaf = await browser.openURL('http://leaf.com', {
      parentTabContainer: mid!.tabContainer,
    });

    expect(findOpenTabsAsChildContainer(leaf)).toBe(root!.tabContainer);
  });
});
