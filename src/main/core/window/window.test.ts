import { expect, test } from 'vitest';
import { Browser } from '@/core';
import { MIN_DESKTOPS } from './constants';

test('recent created window should have MIN_DESKTOPS', () => {
  const browser = new Browser();
  const w = browser.createWindow();
  w.createDefaultDesktops();

  expect(w.desktops.length).toBe(MIN_DESKTOPS);

  for (let i = 0; i < MIN_DESKTOPS; i++) {
    expect(w.desktops[i].id).toBe(i + 1);
    expect(w.desktops[i].label).toBe(`${i + 1}: Unnamed`);
  }
});

test('go to next and previous desktop should work correctly', () => {
  const browser = new Browser();
  const w = browser.createWindow();
  w.createDefaultDesktops();

  expect(w.selectedDesktop.id).toBe(1);

  w.selectDesktop('prev');
  expect(w.selectedDesktop.id).toBe(5);

  w.selectDesktop('next');
  expect(w.selectedDesktop.id).toBe(1);

  w.selectDesktop(5);
  expect(w.selectedDesktop.id).toBe(5);

  w.selectDesktop('next');
  expect(w.selectedDesktop.id).toBe(1);
});

test('select tab should work correctly', async () => {
  const browser = new Browser();
  const w = browser.createWindow();
  w.createDefaultDesktops();

  expect(w.selectedDesktop.id).toBe(1);
  const desktop = w.selectDesktop(3);
  expect(w.selectedDesktop.id).toBe(3);
  expect(desktop).not.toBeNull();
  expect(desktop?.selectedTabContainer).toBeNull();

  const result = browser.openURL('http://example.com');
  expect(result).not.toBeNull();

  const { tab, window, tabContainer } = result!;

  await window.selectTab(tab.id);

  expect(desktop!.selectedTabContainer).not.toBeNull();
  expect(desktop!.selectedTabContainer?.id).toBe(tabContainer.id);
  expect(desktop!.selectedTabContainer!.selectedTab).not.toBeNull();
  expect(desktop!.selectedTabContainer!.selectedTab!.id).toBe(tab.id);
});
