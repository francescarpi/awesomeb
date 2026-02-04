import { expect, test } from 'vitest';
import { Browser } from '@/core';

test('rename desktop works correctly', () => {
  const browser = new Browser();
  const w = browser.createWindow(1);
  w.createDefaultDesktops();

  const d = w.getDesktop(2)!;
  expect(d.label).toBe('2: Unnamed');

  d.setName('Work');
  expect(d.label).toBe('2: Work');
});
