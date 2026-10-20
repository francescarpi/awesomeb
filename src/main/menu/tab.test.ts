import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { Menu } from 'electron';
import type { ContextMenuParams, MenuItemConstructorOptions, WebContents } from 'electron';
import type { Actions } from 'electron-context-menu';
import i18next from 'i18next';
import { Browser, partitions } from '@/core';
import { tabMenu } from './tab';
import { tabWebContentsMenu } from './tab.webcontents';
import { IWinDesConTab } from '~/types';
import { initI18n } from '~/i18n';

beforeAll(initI18n);
afterAll(() => i18next.changeLanguage('en'));

describe('tabMenu', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
  });

  test('Duplicate... submenu click should forward source tab partitionId (issue #200)', async () => {
    browser.createWindow(1, { withDesktops: true });
    const result = await browser.openURL('http://example.com', {
      partitionId: partitions.private.id,
    });
    expect(result).not.toBeNull();
    const tabInfo: IWinDesConTab = browser.getTab(result!.tab.id)!;

    const capturedTemplate: unknown[] = [];
    vi.spyOn(Menu, 'buildFromTemplate').mockImplementation((template) => {
      capturedTemplate.push(template);
      return template as unknown as Menu;
    });

    tabMenu(browser, tabInfo);

    const template = capturedTemplate[0] as Array<{ label?: string; submenu?: unknown[] }>;
    const duplicateItem = template.find((item) => item.label === 'Duplicate...');
    expect(duplicateItem).toBeDefined();
    const submenu = duplicateItem!.submenu as Array<{
      label: string;
      click: () => Promise<void>;
    }>;
    expect(submenu.length).toBeGreaterThan(0);

    const performSpy = vi.spyOn(browser, 'performCommand').mockResolvedValue(undefined);
    await submenu[0].click();

    expect(performSpy).toHaveBeenCalledWith(
      tabInfo.window,
      'duplicate-tab',
      expect.objectContaining({
        tabId: tabInfo.tab.id,
        partitionId: partitions.private.id,
        targetId: expect.any(String),
      }),
    );
  });

  test('Duplicate... submenu should provide one entry per target with partitionId on every click', async () => {
    browser.createWindow(1, { withDesktops: true });
    const result = await browser.openURL('http://example.com', {
      partitionId: partitions.private.id,
    });
    expect(result).not.toBeNull();
    const tabInfo: IWinDesConTab = browser.getTab(result!.tab.id)!;

    const capturedTemplate: unknown[] = [];
    vi.spyOn(Menu, 'buildFromTemplate').mockImplementation((template) => {
      capturedTemplate.push(template);
      return template as unknown as Menu;
    });

    tabMenu(browser, tabInfo);

    const template = capturedTemplate[0] as Array<{ label?: string; submenu?: unknown[] }>;
    const duplicateItem = template.find((item) => item.label === 'Duplicate...');
    const submenu = duplicateItem!.submenu as Array<{
      label: string;
      click: () => Promise<void>;
    }>;

    const performSpy = vi.spyOn(browser, 'performCommand').mockResolvedValue(undefined);
    for (const entry of submenu) {
      performSpy.mockClear();
      await entry.click();
      expect(performSpy).toHaveBeenCalledWith(
        tabInfo.window,
        'duplicate-tab',
        expect.objectContaining({ partitionId: partitions.private.id }),
      );
    }
  });

  // ---------- "Move to split" entry in the tab context menu ----------

  /**
   * Helper: invoke tabMenu with the supplied tab, capture the Electron Menu template
   * (the array passed to Menu.buildFromTemplate), and return the 'Move...' item's
   * submenu array. Returns null when the 'Move...' item is missing.
   */
  async function captureMoveSubmenu(
    tab: IWinDesConTab,
  ): Promise<Array<{ label: string; click: () => Promise<void> }> | null> {
    const capturedTemplate: unknown[] = [];
    vi.spyOn(Menu, 'buildFromTemplate').mockImplementation((template) => {
      capturedTemplate.push(template);
      return template as unknown as Menu;
    });

    tabMenu(browser, tab);

    const template = capturedTemplate[0] as Array<{ label?: string; submenu?: unknown[] }>;
    const moveItem = template.find((item) => item.label === 'Move...');
    if (!moveItem) return null;
    return moveItem.submenu as Array<{ label: string; click: () => Promise<void> }>;
  }

  test("Move... submenu includes 'Split into selected tab' when another tab is the active tab", async () => {
    browser.createWindow(1, { withDesktops: true });

    const tabA = await browser.openURL('http://a.com', { selectTab: true });
    expect(tabA).not.toBeNull();
    const tabB = await browser.openURL('http://b.com');
    expect(tabB).not.toBeNull();
    const tabBInfo: IWinDesConTab = browser.getTab(tabB!.tab.id)!;

    const submenu = await captureMoveSubmenu(tabBInfo);
    expect(submenu).not.toBeNull();
    expect(submenu!.map((e) => e.label)).toContain('Split into selected tab');

    // Clicking that entry must invoke `move-tab` with targetId = 'split-tab' and the
    // right-clicked tab's id (NOT the selected tab's id).
    const performSpy = vi.spyOn(browser, 'performCommand').mockResolvedValue(undefined);
    const splitEntry = submenu!.find((e) => e.label === 'Split into selected tab')!;
    await splitEntry.click();

    expect(performSpy).toHaveBeenCalledWith(
      tabBInfo.window,
      'move-tab',
      expect.objectContaining({
        tabId: tabB!.tab.id,
        targetId: 'split-tab',
      }),
    );
  });

  test("Move... submenu does NOT include 'Split into selected tab' when right-clicking the active tab (cannot move into itself)", async () => {
    browser.createWindow(1, { withDesktops: true });

    // A selected, B not selected, then open a second A-like tab and select IT.
    // We want the right-clicked tab to ALSO be the selected one.
    const tabA = await browser.openURL('http://a.com', { selectTab: true });
    expect(tabA).not.toBeNull();

    // Open another tab but keep it unselected (already implicitly so by default).
    const tabB = await browser.openURL('http://b.com');
    expect(tabB).not.toBeNull();

    // Right-click on tab A (the currently selected/active tab).
    const tabAInfo: IWinDesConTab = browser.getTab(tabA!.tab.id)!;
    const submenu = await captureMoveSubmenu(tabAInfo);
    expect(submenu).not.toBeNull();
    expect(submenu!.map((e) => e.label)).not.toContain('Split into selected tab');
  });

  test("Move... submenu does NOT include 'Move to top level' for a top-level tab", async () => {
    browser.createWindow(1, { withDesktops: true });

    const tabA = await browser.openURL('http://a.com', { selectTab: true });
    expect(tabA).not.toBeNull();
    const tabB = await browser.openURL('http://b.com');
    expect(tabB).not.toBeNull();
    expect(tabB!.tabContainer.parent).toBeNull();

    const tabBInfo: IWinDesConTab = browser.getTab(tabB!.tab.id)!;
    const submenu = await captureMoveSubmenu(tabBInfo);
    expect(submenu).not.toBeNull();
    expect(submenu!.map((e) => e.label)).not.toContain('Move to top level');
  });

  test("Move... submenu includes 'Move to top level' for a child tab under a parent container", async () => {
    browser.createWindow(1, { withDesktops: true });

    const parent = await browser.openURL('http://parent.com', { selectTab: true });
    expect(parent).not.toBeNull();
    const child = await browser.openURL('http://child.com', {
      parentTabContainer: parent!.tabContainer,
    });
    expect(child).not.toBeNull();
    expect(child!.tabContainer.parent).not.toBeNull();

    const childInfo: IWinDesConTab = browser.getTab(child!.tab.id)!;
    const submenu = await captureMoveSubmenu(childInfo);
    expect(submenu).not.toBeNull();

    // 'Move to top level' must appear in the submenu.
    expect(submenu!.map((e) => e.label)).toContain('Move to top level');

    // Clicking it invokes `move-tab` with targetId = 'remove-from-parent' and the
    // right-clicked (child) tab's id.
    const performSpy = vi.spyOn(browser, 'performCommand').mockResolvedValue(undefined);
    const entry = submenu!.find((e) => e.label === 'Move to top level')!;
    await entry.click();

    expect(performSpy).toHaveBeenCalledWith(
      childInfo.window,
      'move-tab',
      expect.objectContaining({
        tabId: child!.tab.id,
        targetId: 'remove-from-parent',
      }),
    );
  });
});

describe('tabWebContentsMenu - Open link in split view availability', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });
  });

  function makeActions(): Actions {
    const item = (): { label: string } => ({ label: '' });
    return {
      copy: item,
      copyLink: item,
      paste: item,
      cut: item,
      separator: item,
      copyImage: item,
      copyImageAddress: item,
      saveImage: item,
      learnSpelling: item,
      inspect: item,
    } as unknown as Actions;
  }

  function buildMenu(tabInfo: IWinDesConTab): MenuItemConstructorOptions[] {
    return tabWebContentsMenu(
      browser,
      tabInfo,
      makeActions(),
      { linkURL: 'http://link.com' } as ContextMenuParams,
      {
        navigationHistory: { canGoBack: () => false, canGoForward: () => false },
      } as unknown as WebContents,
      [],
    );
  }

  function findSplitViewItem(template: MenuItemConstructorOptions[]) {
    return template.find((item) => item.label === 'Open link in split view');
  }

  test('is disabled when the tab container already has MAX_SPLIT_TABS active tabs', async () => {
    const first = await browser.openURL('http://a.com', { selectTab: true });
    await browser.openURL('http://b.com', { targetId: 'split-tab' });
    await browser.openURL('http://c.com', { targetId: 'split-tab' });

    const tabInfo = browser.getTab(first!.tab.id)!;
    expect(tabInfo.tabContainer.activeTabsLength).toBe(3);

    const item = findSplitViewItem(buildMenu(tabInfo));

    expect(item).toBeDefined();
    expect(item!.enabled).toBe(false);
  });

  test('is enabled when closed tabs leave free split slots (regression: ghost tabs)', async () => {
    const first = await browser.openURL('http://a.com', { selectTab: true });
    await browser.openURL('http://b.com', { targetId: 'split-tab' });
    const third = await browser.openURL('http://c.com', { targetId: 'split-tab' });

    third!.tab.markAsClosed();

    const tabInfo = browser.getTab(first!.tab.id)!;
    expect(tabInfo.tabContainer.tabs.length).toBe(3);
    expect(tabInfo.tabContainer.activeTabsLength).toBe(2);

    const item = findSplitViewItem(buildMenu(tabInfo));

    expect(item).toBeDefined();
    expect(item!.enabled).toBe(true);
  });
});
