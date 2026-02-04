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
