import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { Browser, partitions, Window } from '@/core';
import type { UIView } from '@/ui';
import { LAYOUT_ANIMATION_DURATION } from '~/constants';

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

  test('setBounds with animate interpolates through intermediate bounds', async () => {
    const view = window.getView<UIView>('tab-switcher')!;
    const setBoundsSpy = vi.spyOn(view.webContentsView, 'setBounds');

    view.setBounds({ x: 0, y: 0, width: 100, height: 100 });
    setBoundsSpy.mockClear();

    view.setBounds({ x: 0, y: 0, width: 300, height: 100 }, { animate: true });

    await vi.advanceTimersByTimeAsync(LAYOUT_ANIMATION_DURATION + 50);

    const calls = setBoundsSpy.mock.calls.map((c) => c[0]);
    expect(calls.length).toBeGreaterThan(1);

    // Every intermediate call must be a plain setBounds (no native animate
    // option) so the view is resized on every frame.
    for (const call of setBoundsSpy.mock.calls) {
      expect(call[1]).toBeUndefined();
    }

    // The last call must land exactly on the target.
    expect(calls[calls.length - 1]).toEqual({ x: 0, y: 0, width: 300, height: 100 });

    // Intermediate widths must be strictly between the start and the target.
    const widths = calls.map((c: any) => c.width);
    expect(widths.some((w: number) => w > 100 && w < 300)).toBe(true);
  });

  test('an animated shrink also interpolates instead of snapping', async () => {
    const view = window.getView<UIView>('tab-switcher')!;

    // Start wide...
    view.setBounds({ x: 0, y: 0, width: 300, height: 100 });

    // spyOn keeps the original implementation, so the mock keeps track of the
    // bounds and the next animation starts from the right geometry.
    const setBoundsSpy = vi.spyOn(view.webContentsView, 'setBounds');

    // ...then shrink. This is the direction that used to leave the view
    // rendering at its old (wide) size.
    view.setBounds({ x: 0, y: 0, width: 100, height: 100 }, { animate: true });

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
    expect(view.targetBounds).toEqual({ x: 40, y: 0, width: 300, height: 100 });
  });

  test('starting a new animation cancels the previous one', async () => {
    const view = window.getView<UIView>('tab-switcher')!;
    const setBoundsSpy = vi.spyOn(view.webContentsView, 'setBounds');

    view.setBounds({ x: 0, y: 0, width: 100, height: 100 });
    setBoundsSpy.mockClear();

    view.setBounds({ x: 0, y: 0, width: 300, height: 100 }, { animate: true });
    await vi.advanceTimersByTimeAsync(60);

    // A new target replaces the running animation.
    view.setBounds({ x: 0, y: 0, width: 500, height: 100 }, { animate: true });
    await vi.advanceTimersByTimeAsync(LAYOUT_ANIMATION_DURATION + 50);

    const last = setBoundsSpy.mock.calls[setBoundsSpy.mock.calls.length - 1][0];
    expect(last).toEqual({ x: 0, y: 0, width: 500, height: 100 });
  });

  test('the shared animation duration is the expected value', () => {
    expect(LAYOUT_ANIMATION_DURATION).toBe(200);
  });
});
