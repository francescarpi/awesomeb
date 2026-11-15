import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { Browser, partitions, Window } from '@/core';
import type { UIView } from '@/ui';
import { LAYOUT_ANIMATION_DURATION, LAYOUT_ANIMATION_EASING } from '~/constants';

describe('Layout animation', () => {
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

  test('toggleSidebar emits the layout change with the animate flag', () => {
    const spy = vi.spyOn(window.eventsChannel, 'emit');

    window.toggleSidebar(window);

    expect(spy).toHaveBeenCalledWith('window:layout-did-change', window, { animate: true });
  });

  test('toggleMaximizeArea emits the layout change with the animate flag', () => {
    const spy = vi.spyOn(window.eventsChannel, 'emit');

    window.toggleMaximizeArea(window);

    expect(spy).toHaveBeenCalledWith('window:layout-did-change', window, { animate: true });
  });

  test('reduced motion disables the animate flag on the layout change', () => {
    window.reducedMotion = true;
    const spy = vi.spyOn(window.eventsChannel, 'emit');

    window.toggleSidebar(window);

    expect(spy).toHaveBeenCalledWith('window:layout-did-change', window, { animate: false });
  });

  test('reduced motion defaults to false', () => {
    expect(window.reducedMotion).toBe(false);
  });

  test('renderViews forwards the animate option to the views', () => {
    const view = window.getView<UIView>('tab-switcher')!;
    const spy = vi.spyOn(view, 'refreshBounds');

    window.renderViews({ animate: true });

    expect(spy).toHaveBeenCalledWith(window, { animate: true });
  });

  test('renderViews without options does not animate', () => {
    const view = window.getView<UIView>('tab-switcher')!;
    const spy = vi.spyOn(view, 'refreshBounds');

    window.renderViews();

    expect(spy).toHaveBeenCalledWith(window, undefined);
  });

  test('setBounds without the animate flag applies the bounds instantly', () => {
    const view = window.getView<UIView>('tab-switcher')!;
    const setBoundsSpy = vi.spyOn(view.webContentsView, 'setBounds');

    view.setBounds({ x: 0, y: 0, width: 100, height: 100 });

    expect(setBoundsSpy).toHaveBeenCalledTimes(1);
    expect(setBoundsSpy).toHaveBeenCalledWith({ x: 0, y: 0, width: 100, height: 100 });
  });

  test('setBounds with animate delegates to the native Electron animation', () => {
    const view = window.getView<UIView>('tab-switcher')!;
    const setBoundsSpy = vi.spyOn(view.webContentsView, 'setBounds');

    view.setBounds({ x: 0, y: 0, width: 300, height: 100 }, { animate: true });

    expect(setBoundsSpy).toHaveBeenCalledTimes(1);
    expect(setBoundsSpy).toHaveBeenCalledWith(
      { x: 0, y: 0, width: 300, height: 100 },
      {
        animate: {
          duration: LAYOUT_ANIMATION_DURATION,
          easing: LAYOUT_ANIMATION_EASING,
        },
      },
    );
  });

  test('an animated shrink uses the native animation too', () => {
    const view = window.getView<UIView>('tab-switcher')!;

    // Start wide...
    view.setBounds({ x: 0, y: 0, width: 300, height: 100 });

    const setBoundsSpy = vi.spyOn(view.webContentsView, 'setBounds');

    // ...then shrink.
    view.setBounds({ x: 0, y: 0, width: 100, height: 100 }, { animate: true });

    expect(setBoundsSpy).toHaveBeenCalledTimes(1);
    expect(setBoundsSpy).toHaveBeenCalledWith(
      { x: 0, y: 0, width: 100, height: 100 },
      {
        animate: {
          duration: LAYOUT_ANIMATION_DURATION,
          easing: LAYOUT_ANIMATION_EASING,
        },
      },
    );
  });

  test('the target bounds are exposed even while the animation runs', () => {
    const view = window.getView<UIView>('tab-switcher')!;

    view.setBounds({ x: 0, y: 0, width: 100, height: 100 });
    view.setBounds({ x: 40, y: 0, width: 300, height: 100 }, { animate: true });

    // The renderer must read the final geometry, not the intermediate one.
    // Electron's native animation does not update getBounds() until it ends.
    expect(view.targetBounds).toEqual({ x: 40, y: 0, width: 300, height: 100 });
  });

  test('the shared animation duration is the expected value', () => {
    expect(LAYOUT_ANIMATION_DURATION).toBe(200);
  });
});
