import { expect, test } from 'vitest';
import { Browser } from './browser';

test("commands renderer shouldn' return any command becaise there is no focused window", () => {
  const browser = new Browser();
  browser.createWindow();

  expect(browser.renderer.commands()).toEqual([]);
});

test('desktops renderer sould return expected data', () => {
  const browser = new Browser();
  const w = browser.createWindow();
  expect(browser.renderer.desktops(w)).toEqual([
    {
      id: '1',
      label: '1: Unnamed',
      selected: true,
      requireAttention: false,
      hasTabs: false,
      hasActiveTabs: false,
      name: null,
    },
    {
      id: '2',
      label: '2: Unnamed',
      selected: false,
      requireAttention: false,
      hasTabs: false,
      hasActiveTabs: false,
      name: null,
    },
    {
      id: '3',
      label: '3: Unnamed',
      selected: false,
      requireAttention: false,
      hasTabs: false,
      hasActiveTabs: false,
      name: null,
    },
    {
      id: '4',
      label: '4: Unnamed',
      selected: false,
      requireAttention: false,
      hasTabs: false,
      hasActiveTabs: false,
      name: null,
    },
    {
      id: '5',
      label: '5: Unnamed',
      selected: false,
      requireAttention: false,
      hasTabs: false,
      hasActiveTabs: false,
      name: null,
    },
  ]);
});
