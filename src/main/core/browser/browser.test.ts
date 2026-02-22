import { expect, test } from 'vitest';
import { Browser } from '@/core';

test('should create a browser window successfully', () => {
  const browser = new Browser();
  const w1 = browser.createWindow(1);
  expect(browser.windows.length).toBe(1);
  expect(w1).toBeDefined();
  expect(browser.getWindow(w1.id)).toBe(w1);
});

test('openURL in active window/desktop should create a new tabcontainer and tab', () => {
  const browser = new Browser();
  const w = browser.createWindow(1);
  w.createDefaultDesktops();

  const desktop = w.selectedDesktop;
  expect(desktop.tabContainers.length).toBe(0);

  const result = browser.openURL('https://example.com');
  expect(result).not.toBeNull();

  expect(desktop.tabContainers.length).toBe(1);
  expect(desktop.tabContainers[0].id).toBe(1);

  expect(desktop.tabContainers[0].tabs.length).toBe(1);
});

test('move tab (tabcontainer) to another desktop', async () => {
  const browser = new Browser();
  const w = browser.createWindow(1);
  w.createDefaultDesktops();

  const result = await browser.openURL('http://example.com');
  expect(result).not.toBeNull();

  expect(result!.desktop.id).toBe(1);

  browser.moveTab(result!.tab.id, 'desktop-2');

  const tabResult = browser.getTab(result!.tab.id);
  expect(tabResult).not.toBeNull();
  expect(tabResult!.desktop.id).toBe(2);

  expect(w.getDesktop(1)?.tabContainers.length).toBe(0);
  expect(w.getDesktop(2)?.tabContainers.length).toBe(1);
});
