import { expect, test } from 'vitest';
import { Browser } from '@/core';

test('should create a browser window successfully', () => {
  const browser = new Browser();
  const w1 = browser.createWindow();
  expect(browser.windows.length).toBe(1);
  expect(w1).toBeDefined();
  expect(browser.getWindowById(w1.id)).toBe(w1);
});
