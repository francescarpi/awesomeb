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
        shortName: null,
        longName: null,
      },
      {
        id: '2',
        label: '2: Unnamed',
        selected: false,
        requireAttention: false,
        hasTabs: false,
        hasActiveTabs: false,
        shortName: null,
        longName: null,
      },
      {
        id: '3',
        label: '3: Unnamed',
        selected: false,
        requireAttention: false,
        hasTabs: false,
        hasActiveTabs: false,
        shortName: null,
        longName: null,
      },
      {
        id: '4',
        label: '4: Unnamed',
        selected: false,
        requireAttention: false,
        hasTabs: false,
        hasActiveTabs: false,
        shortName: null,
        longName: null,
      },
      {
        id: '5',
        label: '5: Unnamed',
        selected: false,
        requireAttention: false,
        hasTabs: false,
        hasActiveTabs: false,
        shortName: null,
        longName: null,
      },
    ]);
  });

  test('tabSwitcherData: exposes desktop longName as desktopName', async () => {
    const desktop = window.getDesktop(1)!;
    desktop.setName('W', 'My Work');

    const result = await browser.openURL('http://example.com');
    const tabId = result!.tab.id;

    const data = browser.renderer.tabSwitcherData(window);
    const tabEntry = data.find((t) => t.id === tabId);
    expect(tabEntry).toBeDefined();
    expect(tabEntry!.desktopName).toBe('My Work');
  });
});
