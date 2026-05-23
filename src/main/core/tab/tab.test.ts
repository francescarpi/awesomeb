import { expect, test, describe, beforeEach } from 'vitest';
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
