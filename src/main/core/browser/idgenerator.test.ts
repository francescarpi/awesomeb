import { expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions } from '@/core';
import { IdGenerator } from './idgenerator';

describe('IdGenerator', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
  });

  test('nextWindowId returns 1 with no windows', () => {
    const gen = new IdGenerator(browser);
    expect(gen.nextWindowId).toBe(1);
  });

  test('nextWindowId returns max + 1 when windows exist', () => {
    browser.createWindow(1, { withDesktops: true });
    browser.createWindow(5, { withDesktops: true });
    browser.createWindow(3, { withDesktops: true });

    const gen = new IdGenerator(browser);
    expect(gen.nextWindowId).toBe(6);
  });

  test('nextTabContainerId returns 1 with no containers', () => {
    browser.createWindow(1, { withDesktops: true });
    const gen = new IdGenerator(browser);
    expect(gen.nextTabContainerId).toBe(1);
  });

  test('nextTabId returns 1 with no tabs', () => {
    browser.createWindow(1, { withDesktops: true });
    const gen = new IdGenerator(browser);
    expect(gen.nextTabId).toBe(1);
  });

  test('nextTabContainerId counts children at 3 levels of hierarchy (root → mid → leaf)', async () => {
    browser.createWindow(1, { withDesktops: true });

    const root = await browser.openURL('http://root.com');
    const mid = await browser.openURL('http://mid.com', {
      parentTabContainer: root!.tabContainer,
    });
    const leaf = await browser.openURL('http://leaf.com', {
      parentTabContainer: mid!.tabContainer,
    });

    expect(leaf!.tabContainer.id).toBeGreaterThan(0);

    const gen = new IdGenerator(browser);
    expect(gen.nextTabContainerId).toBeGreaterThan(leaf!.tabContainer.id);
  });

  test('nextTabId counts tabs at 3 levels of hierarchy (root → mid → leaf)', async () => {
    browser.createWindow(1, { withDesktops: true });

    const root = await browser.openURL('http://root.com');
    const mid = await browser.openURL('http://mid.com', {
      parentTabContainer: root!.tabContainer,
    });
    const leaf = await browser.openURL('http://leaf.com', {
      parentTabContainer: mid!.tabContainer,
    });

    const gen = new IdGenerator(browser);
    expect(gen.nextTabId).toBeGreaterThan(leaf!.tab.id);
  });

  test('nextTabId counts tabPreview ids', async () => {
    browser.createWindow(1, { withDesktops: true });
    const result = await browser.openURL('http://example.com');
    const tab = result!.tab;

    const PREVIEW_TAB_ID = 999_999;
    Object.defineProperty(tab, 'tabPreview', {
      get: () => ({ tab: { id: PREVIEW_TAB_ID } }),
      configurable: true,
    });

    const gen = new IdGenerator(browser);
    expect(gen.nextTabId).toBeGreaterThan(PREVIEW_TAB_ID);
  });
});
