import { expect, test, describe, beforeEach, vi } from 'vitest';
import type { TTabContainerId } from '~/types';
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

    d.setName('Wrk', 'Work');
    expect(d.label).toBe('2: Work');
  });

  test('setName: trims whitespace from both fields', () => {
    const d = window.getDesktop(2)!;
    d.setName('  Wrk  ', '  Work  ');
    expect(d.shortName).toBe('Wrk');
    expect(d.longName).toBe('Work');
  });

  test('setName: clearing shortName also clears longName (intentional UX)', () => {
    const d = window.getDesktop(2)!;
    d.setName('Wrk', 'Work');
    d.setName('', 'Work');
    expect(d.shortName).toBeNull();
    expect(d.longName).toBeNull();
  });

  test('setName: clearing longName also clears shortName (intentional UX)', () => {
    const d = window.getDesktop(2)!;
    d.setName('Wrk', 'Work');
    d.setName('Wrk', '');
    expect(d.shortName).toBeNull();
    expect(d.longName).toBeNull();
  });

  test('setName: clearing both sets both to null', () => {
    const d = window.getDesktop(2)!;
    d.setName('Wrk', 'Work');
    d.setName('', '');
    expect(d.shortName).toBeNull();
    expect(d.longName).toBeNull();
  });

  test('setName: same value twice emits event only once (no-op second call)', () => {
    const d = window.getDesktop(2)!;
    const emitSpy = vi.spyOn(d.browser.eventsChannel, 'emit');
    d.setName('Wrk', 'Work');
    emitSpy.mockClear();
    d.setName('Wrk', 'Work');
    expect(emitSpy).not.toHaveBeenCalledWith('desktop:name-did-change', expect.anything(), d);
  });

  test('setName: emits desktop:name-did-change event', () => {
    const d = window.getDesktop(2)!;
    const emitSpy = vi.spyOn(d.browser.eventsChannel, 'emit');
    d.setName('Wrk', 'Work');
    expect(emitSpy).toHaveBeenCalledWith('desktop:name-did-change', d.window, d);
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

  test('move tabcontainers having closed tabs works has expected', async () => {
    const d = window.selectedDesktop;

    const t1 = await browser.openURL('http://example1.com');
    const t2 = await browser.openURL('http://example2.com');
    const t3 = await browser.openURL('http://example3.com');

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      t1!.tabContainer.id,
      t2!.tabContainer.id,
      t3!.tabContainer.id,
    ]);

    browser.closeTab(t2!.tab.id);
    expect(t2?.tabContainer.isClosed).toBeTruthy();

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      t1!.tabContainer.id,
      t2!.tabContainer.id,
      t3!.tabContainer.id,
    ]);

    d.moveTabContainer(t3!.tabContainer.id, 'up');

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      t3!.tabContainer.id,
      t1!.tabContainer.id,
      t2!.tabContainer.id,
    ]);

    d.moveTabContainer(t3!.tabContainer.id, 'down');

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      t1!.tabContainer.id,
      t3!.tabContainer.id,
      t2!.tabContainer.id,
    ]);
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

  test('addTabContainer with justAfter inserts tab container in specified position', () => {
    const d = window.getDesktop(2)!;

    const tc1 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const tc2 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
    const tc3 = d.createTabContainer(browser.idGenerator.nextTabContainerId);

    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc2.id, tc3.id]);

    const tc4 = d.createTabContainer(browser.idGenerator.nextTabContainerId, {
      justAfter: tc1.id,
    });
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc4.id, tc2.id, tc3.id]);

    const tc5 = d.createTabContainer(browser.idGenerator.nextTabContainerId, {
      justAfter: tc3.id,
    });
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([tc1.id, tc4.id, tc2.id, tc3.id, tc5.id]);

    const tc6 = d.createTabContainer(browser.idGenerator.nextTabContainerId, {
      justAfter: -1 as TTabContainerId,
    });
    expect(d.tabContainers.map((tc) => tc.id)).toEqual([
      tc1.id,
      tc4.id,
      tc2.id,
      tc3.id,
      tc5.id,
      tc6.id,
    ]);
  });
});
