import { beforeAll, expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions, Window } from '@/core';
import { initI18n } from '~/i18n';

beforeAll(async () => {
  await initI18n();
});

describe('Renderer', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test("commands renderer shouldn' return any command becaise there is no focused window", () => {
    expect(browser.renderer.commandsEntities().length).toBeGreaterThan(0);
  });

  test('desktops renderer sould return expected data', () => {
    expect(browser.renderer.desktopsEntities(window)).toEqual([
      {
        id: '1',
        label: '1: Unnamed',
        selected: true,
        requireAttention: false,
        hasTabs: false,
        hasActiveTabs: false,
        shortName: null,
        longName: null,
      },
      {
        id: '2',
        label: '2: Unnamed',
        selected: false,
        requireAttention: false,
        hasTabs: false,
        hasActiveTabs: false,
        shortName: null,
        longName: null,
      },
      {
        id: '3',
        label: '3: Unnamed',
        selected: false,
        requireAttention: false,
        hasTabs: false,
        hasActiveTabs: false,
        shortName: null,
        longName: null,
      },
      {
        id: '4',
        label: '4: Unnamed',
        selected: false,
        requireAttention: false,
        hasTabs: false,
        hasActiveTabs: false,
        shortName: null,
        longName: null,
      },
      {
        id: '5',
        label: '5: Unnamed',
        selected: false,
        requireAttention: false,
        hasTabs: false,
        hasActiveTabs: false,
        shortName: null,
        longName: null,
      },
    ]);
  });

  test('tabSwitcherData: exposes desktop longName as desktopName', async () => {
    const desktop = window.getDesktop(1)!;
    desktop.setName('W', 'My Work');

    const result = await browser.openURL('http://example.com');
    const tabId = result!.tab.id;

    const data = browser.renderer.tabSwitcherData(window);
    const tabEntry = data.find((t) => t.id === tabId);
    expect(tabEntry).toBeDefined();
    expect(tabEntry!.desktopName).toBe('My Work');
  });

  describe('Renderer.tabContainers - children', () => {
    test('a tabContainer without children has children: []', async () => {
      await browser.openURL('http://example.com');

      const rendered = browser.renderer.tabContainers(window);
      const tc = rendered[0];

      expect(tc.children).toEqual([]);
    });

    test('a child container is serialized without shortcut or divider keys (ISimpleTabContainer shape)', async () => {
      const parent = await browser.openURL('http://parent.com');
      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
      });

      const rendered = browser.renderer.tabContainers(window);
      const parentRendered = rendered.find((t) => t.id === parent!.tabContainer.id);
      expect(parentRendered).toBeDefined();
      expect(parentRendered!.children.length).toBe(1);

      const childRendered = parentRendered!.children[0];
      expect(childRendered.id).toBe(child!.tabContainer.id);

      const childKeys = Object.keys(childRendered).sort();
      expect(childKeys).not.toContain('shortcut');
      expect(childKeys).not.toContain('divider');
      expect(childKeys).toEqual(
        expect.arrayContaining(['id', 'selected', 'tabs', 'desktopId', 'isClosed', 'isSplit']),
      );
    });

    test('child selected flag mirrors desktop.selectedTabContainer', async () => {
      const parent = await browser.openURL('http://parent.com');
      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
        selectTab: true,
      });

      const rendered = browser.renderer.tabContainers(window);
      const parentRendered = rendered.find((t) => t.id === parent!.tabContainer.id);
      const childRendered = parentRendered!.children.find((c) => c.id === child!.tabContainer.id);

      expect(childRendered).toBeDefined();
      expect(childRendered!.selected).toBe(true);
    });

    test('a non-selected child has selected: false', async () => {
      const parent = await browser.openURL('http://parent.com', { selectTab: true });
      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
      });

      const rendered = browser.renderer.tabContainers(window);
      const parentRendered = rendered.find((t) => t.id === parent!.tabContainer.id);
      const childRendered = parentRendered!.children.find((c) => c.id === child!.tabContainer.id);

      expect(childRendered).toBeDefined();
      expect(childRendered!.selected).toBe(false);
    });

    test('child isSplit reflects the CHILD hasSplitTabs, not the parent', async () => {
      const parent = await browser.openURL('http://parent.com', { selectTab: true });
      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
        selectTab: true,
      });
      await browser.openURL('http://second.com', { targetId: 'split-tab' });

      const childTc = child!.tabContainer;
      expect(childTc.tabs.length).toBe(2);
      expect(childTc.hasSplitTabs).toBe(true);
      expect(parent!.tabContainer.hasSplitTabs).toBe(false);

      const rendered = browser.renderer.tabContainers(window);
      const parentRendered = rendered.find((t) => t.id === parent!.tabContainer.id);
      const childRendered = parentRendered!.children.find((c) => c.id === childTc.id);

      expect(childRendered).toBeDefined();
      expect(childRendered!.isSplit).toBe(true);
      expect(parentRendered!.isSplit).toBe(false);
    });

    test('child tabs are serialized completely (id, title, url, etc.)', async () => {
      const parent = await browser.openURL('http://parent.com');
      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
      });

      const rendered = browser.renderer.tabContainers(window);
      const parentRendered = rendered.find((t) => t.id === parent!.tabContainer.id);
      const childRendered = parentRendered!.children[0];

      expect(childRendered.tabs.length).toBe(1);
      const childTab = childRendered.tabs[0];
      expect(childTab.id).toBe(child!.tab.id);
      expect(childTab.url).toBe('http://child.com/');
      expect(typeof childTab.title).toBe('string');
      expect(childTab.desktopId).toBeDefined();
      expect(childTab.windowId).toBeDefined();
    });
  });
});
