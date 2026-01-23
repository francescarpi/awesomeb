import { expect, test } from 'vitest';
import { Browser } from '@main/core';
import { MIN_DESKTOPS } from './constants';

test('recent created window should have MIN_DESKTOPS', () => {
  const browser = new Browser();
  const w1 = browser.createWindow();
  expect(w1.desktops.length).toBe(MIN_DESKTOPS);

  for (let i = 0; i < MIN_DESKTOPS; i++) {
    expect(w1.desktops[i].id).toBe(i + 1);
    expect(w1.desktops[i].label).toBe(`${i + 1}: Unnamed`);
  }
});
