import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { updateLayout } from './helpers';
import type { ILayoutData } from '~/types';
import { LAYOUT_ANIMATION_DURATION, LAYOUT_MARGIN, BORDER_WIDTH } from '~/constants';

function buildLayoutData(overrides: Partial<ILayoutData> = {}): ILayoutData {
  return {
    sidebarCollapsed: false,
    areaMaximized: false,
    hasVisibleTabs: true,
    selectedTabBounds: { x: 100, y: 50, width: 800, height: 600 },
    selectedTabPartitionColor: '#ff0000',
    sidebarWidth: 255,
    animated: false,
    ...overrides,
  };
}

function mountLayoutDom() {
  document.body.innerHTML = `
    <div id="sidebar-container"></div>
    <div id="url-container"></div>
    <div id="tab-container-selected" class="hidden"></div>
  `;
}

describe('updateLayout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mountLayoutDom();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('applies the sidebar width', () => {
    updateLayout(buildLayoutData({ sidebarWidth: 255 }));

    const sidebar = document.getElementById('sidebar-container') as HTMLDivElement;
    expect(sidebar.style.width).toBe(`${255 - LAYOUT_MARGIN}px`);
  });

  test('positions the selected tab overlay from the reported bounds', () => {
    updateLayout(buildLayoutData());

    const overlay = document.getElementById('tab-container-selected') as HTMLDivElement;
    expect(overlay.classList.contains('hidden')).toBe(false);
    expect(overlay.style.left).toBe(`${100 - BORDER_WIDTH}px`);
    expect(overlay.style.top).toBe(`${50 - BORDER_WIDTH}px`);
    expect(overlay.style.width).toBe(`${800 + BORDER_WIDTH * 2}px`);
    expect(overlay.style.height).toBe(`${600 + BORDER_WIDTH * 2}px`);
    expect(overlay.style.borderColor).toBe('rgb(255, 0, 0)');
    expect(overlay.style.opacity).toBe('1');
  });

  test('hides the overlay when there is no selected tab', () => {
    updateLayout(buildLayoutData({ selectedTabBounds: null, selectedTabPartitionColor: null }));

    const overlay = document.getElementById('tab-container-selected') as HTMLDivElement;
    expect(overlay.classList.contains('hidden')).toBe(true);
  });

  test('fades the overlay out and restores it after the animation duration', () => {
    const data = buildLayoutData({ animated: true });

    updateLayout(data);

    const overlay = document.getElementById('tab-container-selected') as HTMLDivElement;
    expect(overlay.style.opacity).toBe('0');

    vi.advanceTimersByTime(LAYOUT_ANIMATION_DURATION);

    expect(overlay.style.opacity).toBe('1');
    expect(overlay.style.left).toBe(`${100 - BORDER_WIDTH}px`);
    expect(overlay.style.width).toBe(`${800 + BORDER_WIDTH * 2}px`);
  });

  test('a non animated update restores the overlay immediately', () => {
    const overlay = document.getElementById('tab-container-selected') as HTMLDivElement;

    updateLayout(buildLayoutData({ animated: true }));
    expect(overlay.style.opacity).toBe('0');

    updateLayout(buildLayoutData({ animated: false }));
    expect(overlay.style.opacity).toBe('1');
  });

  test('a pending animation does not overwrite a later non animated update', () => {
    updateLayout(buildLayoutData({ animated: true }));

    const later = buildLayoutData({
      animated: false,
      selectedTabBounds: { x: 200, y: 60, width: 400, height: 300 },
    });
    updateLayout(later);

    // The stale timer must not restore the previous bounds.
    vi.advanceTimersByTime(LAYOUT_ANIMATION_DURATION * 2);

    const overlay = document.getElementById('tab-container-selected') as HTMLDivElement;
    expect(overlay.style.left).toBe(`${200 - BORDER_WIDTH}px`);
    expect(overlay.style.width).toBe(`${400 + BORDER_WIDTH * 2}px`);
  });

  test('toggles the collapsed class on the sidebar', () => {
    const sidebar = document.getElementById('sidebar-container') as HTMLDivElement;

    updateLayout(buildLayoutData({ sidebarCollapsed: true }));
    expect(sidebar.classList.contains('collapsed')).toBe(true);

    updateLayout(buildLayoutData({ sidebarCollapsed: false }));
    expect(sidebar.classList.contains('collapsed')).toBe(false);
  });

  test('hides the sidebar and url bar when the area is maximized', () => {
    const sidebar = document.getElementById('sidebar-container') as HTMLDivElement;
    const urlContainer = document.getElementById('url-container') as HTMLDivElement;

    updateLayout(buildLayoutData({ areaMaximized: true }));
    expect(sidebar.classList.contains('hidden')).toBe(true);
    expect(urlContainer.classList.contains('hidden')).toBe(true);

    updateLayout(buildLayoutData({ areaMaximized: false }));
    expect(sidebar.classList.contains('hidden')).toBe(false);
    expect(urlContainer.classList.contains('hidden')).toBe(false);
  });
});
