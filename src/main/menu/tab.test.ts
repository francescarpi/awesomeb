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
