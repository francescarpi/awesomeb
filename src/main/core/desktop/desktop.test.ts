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

test('move tabcontainer up and down works correctly', () => {
  const browser = new Browser();
  const w = browser.createWindow(1);
  w.createDefaultDesktops();

  const d = w.getDesktop(2)!;
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
