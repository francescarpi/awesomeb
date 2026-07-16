import { describe, expect, test, vi, beforeEach } from 'vitest';
import { Menu } from 'electron';
import { Browser, partitions } from '@/core';
import { tabMenu } from './tab';
import { IWinDesConTab } from '~/types';

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
