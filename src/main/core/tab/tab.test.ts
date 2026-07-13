import { expect, test, describe, beforeEach, vi } from 'vitest';
import { Browser, partitions } from '@/core';

describe('Tab.setZoom', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });
  });

  async function openTab() {
    const result = await browser.openURL('http://example.com');
    return result!.tab;
  }

  test('zoom in sets factor to 1.1', async () => {
    const tab = await openTab();
    tab.setZoom('in');
    expect(tab.webContents.setZoomFactor).toHaveBeenLastCalledWith(1.1);
  });

  test('zoom out sets factor to 0.9', async () => {
    const tab = await openTab();
    tab.setZoom('out');
    expect(tab.webContents.setZoomFactor).toHaveBeenLastCalledWith(0.9);
  });

  test('reset returns factor to 1.0', async () => {
    const tab = await openTab();
    tab.setZoom('in');
    tab.setZoom('in');
    tab.setZoom('reset');
    expect(tab.webContents.setZoomFactor).toHaveBeenLastCalledWith(1.0);
  });

  test('multiple zoom-ins produce exact values without float drift', async () => {
    const tab = await openTab();
    tab.setZoom('in');
    tab.setZoom('in');
    tab.setZoom('in');
    expect(tab.webContents.setZoomFactor).toHaveBeenLastCalledWith(1.3);
  });

  test('zoom in clamps at 1.9 (MAX_ZOOM_STEP = 9)', async () => {
    const tab = await openTab();
    for (let i = 0; i < 15; i++) tab.setZoom('in');
    expect(tab.webContents.setZoomFactor).toHaveBeenLastCalledWith(1.9);
  });

  test('zoom out clamps at 0.5 (MIN_ZOOM_STEP = -5)', async () => {
    const tab = await openTab();
    for (let i = 0; i < 10; i++) tab.setZoom('out');
    expect(tab.webContents.setZoomFactor).toHaveBeenLastCalledWith(0.5);
  });
});

describe('Tab.resume', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });
  });

  async function openTab() {
    const result = await browser.openURL('http://example.com');
    return result!.tab;
  }

  test('should set suspended = false', async () => {
    const tab = await openTab();
    tab.activate();
    tab.suspend();
    expect(tab.suspended).toBe(true);

    tab.resume();

    expect(tab.suspended).toBe(false);
  });

  test('should clear closedAt when called on a closed tab', async () => {
    const tab = await openTab();
    tab.markAsClosed();
    expect(tab.isClosed).toBe(true);
    expect(tab.closedAt).not.toBeNull();

    tab.resume();

    expect(tab.isClosed).toBe(false);
    expect(tab.closedAt).toBeNull();
  });

  test('should reindex webContents in the browser', async () => {
    const tab = await openTab();
    const reindexSpy = vi.spyOn(browser, 'reindexWebContents');

    tab.resume();

    expect(reindexSpy).toHaveBeenCalledWith(tab);
  });

  test('should be safe to call multiple times (idempotent)', async () => {
    const tab = await openTab();
    tab.activate();

    expect(() => {
      tab.resume();
      tab.resume();
      tab.resume();
    }).not.toThrow();

    expect(tab.suspended).toBe(false);
  });

  test('should refresh webContentsView when destroyed', async () => {
    const tab = await openTab();
    tab.activate();
    tab.webContents.isDestroyed = (): boolean => true;

    const refreshSpy = vi.spyOn(tab, 'refreshWebContentsView');

    tab.resume();

    expect(refreshSpy).toHaveBeenCalled();
    expect(tab.suspended).toBe(false);
  });
});

describe('Tab.setTitle', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });
  });

  async function openTab() {
    const result = await browser.openURL('http://example.com');
    return result!.tab;
  }

  test('sets title from non-empty string', async () => {
    const tab = await openTab();
    tab.setTitle('Hello World');
    expect(tab.rawTitle).toBe('Hello World');
  });

  test('trims whitespace and sets title', async () => {
    const tab = await openTab();
    tab.setTitle('  Hello World  ');
    expect(tab.rawTitle).toBe('Hello World');
  });

  test('empty string sets title to null', async () => {
    const tab = await openTab();
    tab.setTitle('Hello World');
    tab.setTitle('');
    expect(tab.rawTitle).toBe('Untitled');
  });

  test('whitespace-only string sets title to null', async () => {
    const tab = await openTab();
    tab.setTitle('Hello World');
    tab.setTitle('   ');
    expect(tab.rawTitle).toBe('Untitled');
  });
});

describe('Tab.isTabPreview', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });
  });

  test('defaults to false on a newly opened tab', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result!.tab.isTabPreview).toBe(false);
  });

  test('can be toggled via setIsTabPreview', async () => {
    const result = await browser.openURL('http://example.com');
    const tab = result!.tab;

    tab.setIsTabPreview(true);
    expect(tab.isTabPreview).toBe(true);

    tab.setIsTabPreview(false);
    expect(tab.isTabPreview).toBe(false);
  });

  test('passing parent to openTabPreview sets isTabPreview to true', async () => {
    const window = browser.activeWindow!;
    const result = await browser.openURL('http://parent.example.com');
    const parentTab = result!.tab;

    browser.openTabPreview(window, parentTab, 'http://preview.example.com');

    const preview = parentTab.tabPreview!.tab;
    expect(preview.isTabPreview).toBe(true);
  });
});
