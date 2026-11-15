import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { Browser, partitions, Window } from '@/core';
import type { UIView } from '@/ui';
import {
  LAYOUT_ANIMATION_DURATION,
  LAYOUT_ANIMATION_EASING,
  BOUNDS_ANIMATION_FRAME_INTERVAL,
} from '~/constants';

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

  test('setBounds with animate delegates to the native Electron animation when growing', () => {
    const view = window.getView<UIView>('tab-switcher')!;

    view.setBounds({ x: 0, y: 0, width: 100, height: 100 });

    const setBoundsSpy = vi.spyOn(view.webContentsView, 'setBounds');

    // Growing -> native animation (clip wipe), the page is laid out at the
    // final width and revealed progressively.
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

  test('setBounds with animate interpolates the bounds when shrinking', async () => {
    const view = window.getView<UIView>('tab-switcher')!;

    // Start wide...
    view.setBounds({ x: 0, y: 0, width: 300, height: 100 });

    const setBoundsSpy = vi.spyOn(view.webContentsView, 'setBounds');

    // ...then shrink. Electron's native animation cannot do this properly: it
    // keeps the old surface size and clips it, so the page stays laid out at
    // the old width and the text is cut off mid-word. We interpolate instead.
    view.setBounds({ x: 0, y: 0, width: 100, height: 100 }, { animate: true });

    // The native animation must NOT be used for the shrink.
    for (const call of setBoundsSpy.mock.calls) {
      expect(call[1]).toBeUndefined();
    }

    await vi.advanceTimersByTimeAsync(LAYOUT_ANIMATION_DURATION + 50);

    const widths = setBoundsSpy.mock.calls.map((c: any) => c[0].width);
    expect(widths.length).toBeGreaterThan(1);
    expect(widths.some((w: number) => w > 100 && w < 300)).toBe(true);
    expect(widths[widths.length - 1]).toBe(100);
  });

  test('the target bounds are exposed even while the animation runs', () => {
    const view = window.getView<UIView>('tab-switcher')!;

    view.setBounds({ x: 0, y: 0, width: 100, height: 100 });
    view.setBounds({ x: 40, y: 0, width: 300, height: 100 }, { animate: true });

    // The renderer must read the final geometry, not the intermediate one.
    // Electron's native animation does not update getBounds() until it ends.
    expect(view.targetBounds).toEqual({ x: 40, y: 0, width: 300, height: 100 });
  });

  test('the interpolated easing matches the native Electron easing', async () => {
    const view = window.getView<UIView>('tab-switcher')!;

    view.setBounds({ x: 0, y: 0, width: 300, height: 100 });

    const setBoundsSpy = vi.spyOn(view.webContentsView, 'setBounds');

    view.setBounds({ x: 0, y: 0, width: 100, height: 100 }, { animate: true });

    await vi.advanceTimersByTimeAsync(LAYOUT_ANIMATION_DURATION + 50);

    const widths = setBoundsSpy.mock.calls.map((c: any) => c[0].width);

    // gfx::Tween::EASE_IN_OUT, the curve Electron uses for "ease-in-out":
    //   t < 0.5   -> pow(t * 2, 2) / 2
    //   t >= 0.5  -> 1 - pow((t - 1) * 2, 2) / 2
    // The shrink path must follow the very same curve, otherwise the sidebar
    // (CSS) and the web contents view would desync.
    const nativeEaseInOut = (t: number) =>
      t < 0.5 ? Math.pow(t * 2, 2) / 2 : 1 - Math.pow((t - 1) * 2, 2) / 2;

    const start = 300;
    const end = 100;
    const frames = widths.slice(0, -1); // the last call is the final bounds

    frames.forEach((width: number, index: number) => {
      // The progress of each frame, approximated from the elapsed time.
      const progress = Math.min(
        (index * BOUNDS_ANIMATION_FRAME_INTERVAL) / LAYOUT_ANIMATION_DURATION,
        1,
      );
      const expected = Math.round(start + (end - start) * nativeEaseInOut(progress));
      expect(Math.abs(width - expected)).toBeLessThanOrEqual(2);
    });
  });

  test('the shared animation duration is the expected value', () => {
    expect(LAYOUT_ANIMATION_DURATION).toBe(200);
  });
});
