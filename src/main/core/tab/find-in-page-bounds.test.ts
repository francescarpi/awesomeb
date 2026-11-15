import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { Browser, partitions, Window } from '@/core';
import { LAYOUT_ANIMATION_DURATION } from '~/constants';
import { FIND_IN_PAGE_VIEW_HEIGHT } from './constants';
import { LAYOUT_MARGIN } from '~/constants';

/**
 * The find-in-page bar sits BELOW the tab and mirrors the tab's width. Both
 * views are animated at the same time, so the bar must animate toward the
 * tab's FINAL width, not toward the tab's intermediate width.
 */
describe('Find-in-page view follows the tab width', () => {
  let browser: Browser;
  let window: Window;

  beforeEach(() => {
    vi.useFakeTimers();
    browser = new Browser();
    partitions.init();
    window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('the find-in-page bar targets the tab final width, not the intermediate one', async () => {
    const result = await browser.openURL('http://example.com');
    expect(result).not.toBeNull();

    const { tab } = result!;
    tab.startFindInPage();

    const findInPage = tab.findInPage!;
    expect(findInPage).not.toBeNull();

    // Give the views a known starting geometry.
    tab.setBounds({ x: 260, y: 34, width: 535, height: 561 });
    findInPage.setBounds({
      x: 260,
      y: 34 + 561 + LAYOUT_MARGIN,
      width: 535,
      height: FIND_IN_PAGE_VIEW_HEIGHT,
    });

    // Toggle the sidebar: the tab grows.
    window.toggleSidebar(window);

    // The bar must animate toward the SAME final width as the tab.
    const tabTarget = tab.targetBounds;
    const findTarget = findInPage.targetBounds;

    expect(findTarget.width).toBe(tabTarget.width);
    expect(findTarget.x).toBe(tabTarget.x);
  });

  test('the find-in-page bar ends up at the same width as the tab', async () => {
    const result = await browser.openURL('http://example.com');
    const { tab } = result!;
    tab.startFindInPage();
    const findInPage = tab.findInPage!;

    tab.setBounds({ x: 260, y: 34, width: 535, height: 561 });
    findInPage.setBounds({
      x: 260,
      y: 34 + 561 + LAYOUT_MARGIN,
      width: 535,
      height: FIND_IN_PAGE_VIEW_HEIGHT,
    });

    window.toggleSidebar(window);
    await vi.advanceTimersByTimeAsync(LAYOUT_ANIMATION_DURATION + 50);

    expect(findInPage.bounds.width).toBe(tab.bounds.width);
    expect(findInPage.bounds.x).toBe(tab.bounds.x);
  });
});
