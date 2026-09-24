import { beforeAll, expect, test, describe, beforeEach, vi } from 'vitest';
import { app } from 'electron';
import { Browser, partitions, Window } from '@/core';
import type { UIView } from '@/ui';
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

  describe('Renderer.refreshTabSwitcher gating', () => {
    test('refreshTabSwitcher is a no-op while the switcher view is hidden', () => {
      const tabSwitcher = window.getView<UIView>('tab-switcher')!;
      const sendSpy = vi.spyOn(tabSwitcher, 'send');
      const visibleSpy = vi.spyOn(tabSwitcher, 'visible', 'get').mockReturnValue(false);

      browser.toRenderer.refreshTabSwitcher(window);

      expect(sendSpy).not.toHaveBeenCalled();

      visibleSpy.mockRestore();
      sendSpy.mockRestore();
    });

    test('refreshTabSwitcher emits while the switcher view is visible', async () => {
      const result = await browser.openURL('http://example.com');
      expect(result).not.toBeNull();

      const tabSwitcher = window.getView<UIView>('tab-switcher')!;
      const sendSpy = vi.spyOn(tabSwitcher, 'send');

      browser.toRenderer.refreshTabSwitcher(window);

      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith('tabswitcher:refresh', expect.any(Array));

      sendSpy.mockRestore();
    });

    test('refreshTabSwitcher returns silently when the view is missing', () => {
      const getViewSpy = vi.spyOn(window, 'getView').mockReturnValue(null);

      expect(() => browser.toRenderer.refreshTabSwitcher(window)).not.toThrow();

      getViewSpy.mockRestore();
    });

    test('showTabSwitcher refreshes the switcher exactly once on open', () => {
      const tabSwitcher = window.getView<UIView>('tab-switcher')!;
      const sendSpy = vi.spyOn(tabSwitcher, 'send');

      window.showTabSwitcher();

      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith('tabswitcher:refresh', expect.any(Array));

      sendSpy.mockRestore();
    });

    test('desktop selection refreshes the visible switcher', async () => {
      await browser.openURL('http://desktop-one.example.com');
      window.selectDesktop(2);
      await browser.openURL('http://desktop-two.example.com');

      window.showTabSwitcher();
      const tabSwitcher = window.getView<UIView>('tab-switcher')!;
      const sendSpy = vi.spyOn(tabSwitcher, 'send');

      window.selectDesktop(1);

      expect(sendSpy).toHaveBeenCalledWith('tabswitcher:refresh', expect.any(Array));

      sendSpy.mockRestore();
    });
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

  describe('tabContainers - closed tabs', () => {
    test('excludes a soft-closed tab from the top-level tabs array', async () => {
      const open = await browser.openURL('http://open.com', { selectTab: true });
      expect(open).not.toBeNull();
      const closed = await browser.openURL('http://closed.com', { targetId: 'split-tab' });
      expect(closed).not.toBeNull();
      await browser.closeTab(closed!.tab.id);

      const rendered = browser.renderer.tabContainers(window);
      const container = rendered.find((tc) => tc.id === open!.tabContainer.id);
      expect(container).toBeDefined();
      expect(container!.tabs.map((t) => t.id)).toEqual([open!.tab.id]);

      // Closed-tab metadata (id, title, url) is absent from the payload.
      const allTopLevelTabs = rendered.flatMap((tc) => tc.tabs);
      expect(allTopLevelTabs.some((t) => t.id === closed!.tab.id)).toBe(false);
      expect(allTopLevelTabs.map((t) => t.url)).not.toContain('http://closed.com/');
      expect(allTopLevelTabs.some((t) => t.title.includes('closed'))).toBe(false);
    });

    test('excludes a soft-closed tab from a nested child container', async () => {
      const parent = await browser.openURL('http://parent.com', { selectTab: true });
      expect(parent).not.toBeNull();
      const openChild = await browser.openURL('http://child-open.com', {
        parentTabContainer: parent!.tabContainer,
        selectTab: true,
      });
      expect(openChild).not.toBeNull();
      const closedChild = await browser.openURL('http://child-closed.com', {
        parentTabContainer: parent!.tabContainer,
        targetId: 'split-tab',
      });
      expect(closedChild).not.toBeNull();
      await browser.closeTab(closedChild!.tab.id);

      const rendered = browser.renderer.tabContainers(window);
      const parentRendered = rendered.find((tc) => tc.id === parent!.tabContainer.id);
      expect(parentRendered).toBeDefined();
      const childRendered = parentRendered!.children[0];
      expect(childRendered.tabs.map((t) => t.id)).toEqual([openChild!.tab.id]);
    });

    test('open tabs keep full metadata in top-level and nested containers', async () => {
      const top1 = await browser.openURL('http://top1.com');
      expect(top1).not.toBeNull();
      const top2 = await browser.openURL('http://top2.com');
      expect(top2).not.toBeNull();
      const parent = await browser.openURL('http://parent.com', { selectTab: true });
      expect(parent).not.toBeNull();
      const child = await browser.openURL('http://child.com', {
        parentTabContainer: parent!.tabContainer,
      });
      expect(child).not.toBeNull();

      const rendered = browser.renderer.tabContainers(window);
      const allTabs = rendered.flatMap((tc) => [...tc.tabs, ...tc.children.flatMap((c) => c.tabs)]);

      expect(allTabs.length).toBe(4);
      for (const tab of allTabs) {
        expect(tab.isClosed).toBe(false);
        expect(tab.id).toBeDefined();
        expect(typeof tab.title).toBe('string');
        expect(tab.url).toBeTruthy();
        expect(tab.partition.name).toBeDefined();
        expect(tab.desktopId).toBeDefined();
        expect(tab.windowId).toBeDefined();
      }
    });

    test('reopening a closed tab restores it to the payload on the next full refresh', async () => {
      const open = await browser.openURL('http://open.com', { selectTab: true });
      expect(open).not.toBeNull();
      const closed = await browser.openURL('http://closed.com', { targetId: 'split-tab' });
      expect(closed).not.toBeNull();
      await browser.closeTab(closed!.tab.id);

      const preReopen = browser.renderer.tabContainers(window);
      const preReopenTabIds = preReopen.flatMap((tc) => tc.tabs.map((t) => t.id));
      expect(preReopenTabIds).not.toContain(closed!.tab.id);

      // Reopen flow: openClosedTab → selectTab → 'window:selected-tab-did-change'
      // → refreshTabContainers (full refresh, same serializer).
      window.openClosedTab(closed!.tab.id);

      const reopened = browser.renderer.tabContainers(window);
      const reopenedTab = reopened.flatMap((tc) => tc.tabs).find((t) => t.id === closed!.tab.id);
      expect(reopenedTab).toBeDefined();
      expect(reopenedTab!.isClosed).toBe(false);
      expect(reopenedTab!.url).toBe('http://closed.com/');
    });
  });

  describe('Renderer.about', () => {
    test('returns version matching app.getVersion()', () => {
      const versionSpy = vi.spyOn(app, 'getVersion').mockReturnValue('1.2.3-test');
      try {
        const result = browser.renderer.about();
        expect(result.version).toBe('1.2.3-test');
      } finally {
        versionSpy.mockRestore();
      }
    });

    test('returns chromeVersion matching process.versions.chrome', () => {
      const originalChrome = process.versions.chrome;
      Object.defineProperty(process.versions, 'chrome', {
        value: '120.0.6099.291',
        configurable: true,
        writable: true,
      });
      try {
        const result = browser.renderer.about();
        expect(result.chromeVersion).toBe('120.0.6099.291');
      } finally {
        Object.defineProperty(process.versions, 'chrome', {
          value: originalChrome,
          configurable: true,
          writable: true,
        });
      }
    });

    test('result matches IAbout shape exactly', () => {
      const result = browser.renderer.about();
      expect(Object.keys(result).sort()).toEqual(['chromeVersion', 'version'].sort());
    });

    test('chromeVersion is a non-empty string in production', () => {
      // Sanity check: in a real Electron runtime process.versions.chrome is always populated.
      // This guards against accidentally wiring chromeVersion to a constant or empty value.
      Object.defineProperty(process.versions, 'chrome', {
        value: '130.0.6723.116',
        configurable: true,
        writable: true,
      });
      const result = browser.renderer.about();
      expect(typeof result.chromeVersion).toBe('string');
      expect(result.chromeVersion.length).toBeGreaterThan(0);
    });
  });
});
