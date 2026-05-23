import { expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions, Window } from '@/core';

describe('Renderer', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test("commands renderer shouldn' return any command becaise there is no focused window", () => {
    expect(browser.renderer.commandsEntities().length).toBeGreaterThan(0);
  });

  test('desktops renderer sould return expected data', () => {
    expect(browser.renderer.desktopsEntities(window)).toEqual([
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
});
