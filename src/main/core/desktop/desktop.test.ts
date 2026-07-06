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

  describe('getTabContainerByIndex (top-level only)', () => {
    test('returns top-level containers by index, skipping child containers', async () => {
      const d = window.getDesktop(2)!;
      const tc1 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
      const tc2 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
      const tc3 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
      const tc4 = d.createTabContainer(browser.idGenerator.nextTabContainerId);

      const parent = (await browser.openURL('http://parent.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      await browser.openURL('http://child1.com');
      await browser.openURL('http://child2.com');

      expect(d.getTabContainerByIndex(0)).toBe(tc1);
      expect(d.getTabContainerByIndex(1)).toBe(tc2);
      expect(d.getTabContainerByIndex(2)).toBe(tc3);
      expect(d.getTabContainerByIndex(3)).toBe(tc4);
      expect(d.getTabContainerByIndex(4)).toBeNull();
    });

    test('returns null for indices out of range', () => {
      const d = window.getDesktop(2)!;
      d.createTabContainer(browser.idGenerator.nextTabContainerId);

      expect(d.getTabContainerByIndex(-1)).toBeNull();
      expect(d.getTabContainerByIndex(1)).toBeNull();
      expect(d.getTabContainerByIndex(99)).toBeNull();
    });

    test('skips closed child containers too (only top-level + open)', async () => {
      const d = window.getDesktop(2)!;
      const tc1 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
      const tc2 = d.createTabContainer(browser.idGenerator.nextTabContainerId);

      const parent = (await browser.openURL('http://parent.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      const child = (await browser.openURL('http://child.com'))!;

      child.tabContainer.tabs[0].markAsClosed();

      expect(d.getTabContainerByIndex(0)).toBe(tc1);
      expect(d.getTabContainerByIndex(1)).toBe(tc2);
      expect(d.getTabContainerByIndex(2)).toBeNull();
    });
  });

  describe('moveTabContainer with parent/child hierarchy', () => {
    test('moving a top-level container up swaps with adjacent top-level only, ignoring children of neighbours', async () => {
      window.selectDesktop(2);
      const d = window.getDesktop(2)!;
      const tc1 = d.createTabContainer(browser.idGenerator.nextTabContainerId);
      const tc2 = d.createTabContainer(browser.idGenerator.nextTabContainerId);

      const parent1 = (await browser.openURL('http://parent1.com', { selectTab: true }))!;
      parent1.tab.setOpenTabsAsChild(true);
      const child1 = (await browser.openURL('http://child1.com'))!;
      const child2 = (await browser.openURL('http://child2.com'))!;

      // skipParent so opening parent2 doesn't auto-become a child of parent1
      const parent2 = (await browser.openURL('http://parent2.com', {
        selectTab: true,
        skipParent: true,
      }))!;
      parent2.tab.setOpenTabsAsChild(true);

      const tcParent1 = parent1.tabContainer;
      const tcParent2 = parent2.tabContainer;
      const tcChild1 = child1.tabContainer;
      const tcChild2 = child2.tabContainer;

      d.moveTabContainer(tcParent2.id, 'up');

      // tcParent2 swaps with tcParent1; children stay attached to tcParent1
      const topLevelIds = d.tabContainers.filter((tc) => tc.parentTab === null).map((tc) => tc.id);
      expect(topLevelIds).toEqual([tc1.id, tc2.id, tcParent2.id, tcParent1.id]);

      // Children still belong to parent1 and remain in their original sibling order
      const child1Container = d.tabContainers.find((tc) => tc.id === tcChild1.id)!;
      const child2Container = d.tabContainers.find((tc) => tc.id === tcChild2.id)!;
      expect(child1Container.parentTab).toBe(parent1.tab);
      expect(child2Container.parentTab).toBe(parent1.tab);
    });

    test('moving a child container up swaps with its previous sibling only', async () => {
      window.selectDesktop(2);

      const parent1 = (await browser.openURL('http://parent1.com', { selectTab: true }))!;
      parent1.tab.setOpenTabsAsChild(true);
      const child1 = (await browser.openURL('http://child1-a.com'))!;
      const child2 = (await browser.openURL('http://child1-b.com'))!;

      const parent2 = (await browser.openURL('http://parent2.com', {
        selectTab: true,
        skipParent: true,
      }))!;
      parent2.tab.setOpenTabsAsChild(true);
      await browser.openURL('http://child2-a.com');

      const tcChild1 = child1.tabContainer;
      const tcChild2 = child2.tabContainer;
      const tcParent1 = parent1.tabContainer;
      const tcParent2 = parent2.tabContainer;

      const d = window.getDesktop(2)!;
      d.moveTabContainer(tcChild2.id, 'up');

      const tcChild1After = d.tabContainers.find((tc) => tc.id === tcChild1.id)!;
      const tcChild2After = d.tabContainers.find((tc) => tc.id === tcChild2.id)!;

      // Child2 is now first sibling of parent1
      expect(tcChild2After.parentTab).toBe(parent1.tab);
      expect(tcChild1After.parentTab).toBe(parent1.tab);

      // Verify by walking parent1's children in order via desktop.tabContainers
      const siblingsOfParent1 = d.tabContainers.filter(
        (tc) => tc.parentTab !== null && tc.parentTab.id === parent1.tab.id,
      );
      expect(siblingsOfParent1.map((tc) => tc.id)).toEqual([tcChild2.id, tcChild1.id]);

      // Top-level containers untouched
      const topLevelIds = d.tabContainers.filter((tc) => tc.parentTab === null).map((tc) => tc.id);
      expect(topLevelIds).toEqual([tcParent1.id, tcParent2.id]);
    });

    test('moving a child container down swaps with its next sibling only', async () => {
      window.selectDesktop(2);

      const parent = (await browser.openURL('http://parent.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      const child1 = (await browser.openURL('http://child-a.com'))!;
      const child2 = (await browser.openURL('http://child-b.com'))!;

      const tcChild1 = child1.tabContainer;
      const tcChild2 = child2.tabContainer;

      const d = window.getDesktop(2)!;
      d.moveTabContainer(tcChild1.id, 'down');

      const siblings = d.tabContainers.filter(
        (tc) => tc.parentTab !== null && tc.parentTab.id === parent.tab.id,
      );
      expect(siblings.map((tc) => tc.id)).toEqual([tcChild2.id, tcChild1.id]);
    });

    test('moving a child at the top up is a no-op (stays in place)', async () => {
      window.selectDesktop(2);

      const parent = (await browser.openURL('http://parent.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      const child1 = (await browser.openURL('http://child-a.com'))!;
      await browser.openURL('http://child-b.com');

      const tcChild1 = child1.tabContainer;

      const d = window.getDesktop(2)!;
      // Move child1 up: should be no-op since it's the first sibling
      d.moveTabContainer(tcChild1.id, 'up');

      const siblings = d.tabContainers.filter(
        (tc) => tc.parentTab !== null && tc.parentTab.id === parent.tab.id,
      );
      expect(siblings.map((tc) => tc.id)[0]).toBe(tcChild1.id);
    });

    test('moving a child at the bottom down is a no-op (stays in place)', async () => {
      window.selectDesktop(2);

      const parent = (await browser.openURL('http://parent.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      await browser.openURL('http://child-a.com');
      const child2 = (await browser.openURL('http://child-b.com'))!;

      const tcChild2 = child2.tabContainer;

      const d = window.getDesktop(2)!;
      d.moveTabContainer(tcChild2.id, 'down');

      const siblings = d.tabContainers.filter(
        (tc) => tc.parentTab !== null && tc.parentTab.id === parent.tab.id,
      );
      expect(siblings.map((tc) => tc.id).at(-1)).toBe(tcChild2.id);
    });

    test('moving a child does not cross into another parent', async () => {
      window.selectDesktop(2);

      const parent1 = (await browser.openURL('http://parent1.com', { selectTab: true }))!;
      parent1.tab.setOpenTabsAsChild(true);
      const child1of1 = (await browser.openURL('http://child1of1.com'))!;

      const parent2 = (await browser.openURL('http://parent2.com', {
        selectTab: true,
        skipParent: true,
      }))!;
      parent2.tab.setOpenTabsAsChild(true);
      const child1of2 = (await browser.openURL('http://child1of2.com'))!;

      const tcChild1of2 = child1of2.tabContainer;

      const d = window.getDesktop(2)!;
      d.moveTabContainer(tcChild1of2.id, 'up');

      // child1of2 must still be a child of parent2, not of parent1
      const tcChild1of2After = d.tabContainers.find((tc) => tc.id === tcChild1of2.id)!;
      expect(tcChild1of2After.parentTab).toBe(parent2.tab);

      const siblingsOfParent2 = d.tabContainers.filter(
        (tc) => tc.parentTab !== null && tc.parentTab.id === parent2.tab.id,
      );
      expect(siblingsOfParent2.map((tc) => tc.id)).toEqual([tcChild1of2.id]);

      const siblingsOfParent1 = d.tabContainers.filter(
        (tc) => tc.parentTab !== null && tc.parentTab.id === parent1.tab.id,
      );
      expect(siblingsOfParent1.map((tc) => tc.id)).toEqual([child1of1.tabContainer.id]);
    });
  });
});
