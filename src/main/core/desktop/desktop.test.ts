import { expect, test, describe, beforeEach } from 'vitest';
import { Browser, partitions, Window } from '@/core';

describe('Desktop', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  test('rename desktop works correctly', () => {
    const d = window.getDesktop(2)!;
    expect(d.label).toBe('2: Unnamed');

    d.setName('Work');
    expect(d.label).toBe('2: Work');
  });

  test('move tabcontainer up and down works correctly', () => {
    const d = window.getDesktop(2)!;
    const tc1 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const tc2 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const tc3 = d.createTabContainer(browser.idGenerator.nextTabContainerId);

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc2.id, tc3.id]);

    // Move tc2 up
    d.moveTabContainer(tc2.id, 'up');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc2.id, tc1.id, tc3.id]);

    // Move tc2 up again (should do nothing)
    d.moveTabContainer(tc2.id, 'up');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc2.id, tc1.id, tc3.id]);

    // Move tc2 down
    d.moveTabContainer(tc2.id, 'down');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc2.id, tc3.id]);

    // Move tc2 down again
    d.moveTabContainer(tc2.id, 'down');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc3.id, tc2.id]);

    // Move tc2 down again (should do nothing)
    d.moveTabContainer(tc2.id, 'down');
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc3.id, tc2.id]);
  });

  test('getTabsBelow returns correct tabs', async () => {
    const d = window.selectedDesktop;

    const result1 = await browser.openURL('http://example1.com');
    const result2 = await browser.openURL('http://example2.com');
    const result3 = await browser.openURL('http://example3.com');

    const tab1 = result1!.tab;
    const tab2 = result2!.tab;
    const tab3 = result3!.tab;

    const tabsBelowTab1 = d.getTabsBelow(tab1.id);
    expect(tabsBelowTab1.map((t) => t.tab.id)).toEqual([tab2.id, tab3.id]);

    const tabsBelowTab2 = d.getTabsBelow(tab2.id);
    expect(tabsBelowTab2.map((t) => t.tab.id)).toEqual([tab3.id]);

    const tabsBelowTab3 = d.getTabsBelow(tab3.id);
    expect(tabsBelowTab3.map((t) => t.tab.id)).toEqual([]);
  });
});
