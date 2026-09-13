import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshUrlBarOrTab, refreshTabAttentionState } from './events.herlpers';
import type { Browser, Tab } from '@/core';
import type { TTabId, TWindowId } from '~/types';

// ---------------------------------------------------------------------------
// Mock harness
// ---------------------------------------------------------------------------

interface MockTab {
  id: TTabId;
}

interface MockDesktop {
  id: number;
  selectedTab: { tab: MockTab } | null;
  tabs: MockTab[];
}

interface MockWindow {
  id: TWindowId;
  selectedDesktop: MockDesktop;
}

interface MockBrowserResult {
  tab: MockTab;
  window: MockWindow;
  desktop: MockDesktop;
}

function createMockDesktop(id: number, selectedTabId: TTabId | null = null): MockDesktop {
  return {
    id,
    selectedTab: selectedTabId === null ? null : { tab: { id: selectedTabId } },
    tabs: selectedTabId === null ? [] : [{ id: selectedTabId }],
  };
}

function createMockWindow(id: TWindowId, desktop: MockDesktop): MockWindow {
  return { id, selectedDesktop: desktop };
}

function createHarness() {
  const refreshDesktops = vi.fn();
  const refreshURLBar = vi.fn();
  const refreshTabNavigation = vi.fn();
  const refreshOneTab = vi.fn();
  const refreshMainMenu = vi.fn();

  // tabRegistry: tabId -> { tab, window, desktop }.
  // windowRegistry: windowId -> window. The harness owns these so tests can
  // mutate them between queue and flush to simulate late lifecycle changes.
  const tabRegistry = new Map<TTabId, MockBrowserResult>();
  const windowRegistry = new Map<TWindowId, MockWindow>();

  const browser = {
    getTab: vi.fn((id: TTabId): MockBrowserResult | null => tabRegistry.get(id) ?? null),
    getWindow: vi.fn((id: TWindowId): MockWindow | null => windowRegistry.get(id) ?? null),
    toRenderer: {
      refreshDesktops,
      refreshURLBar,
      refreshTabNavigation,
      refreshOneTab,
    },
    refreshMainMenu,
  } as unknown as Browser & {
    toRenderer: {
      refreshDesktops: ReturnType<typeof vi.fn>;
      refreshURLBar: ReturnType<typeof vi.fn>;
      refreshTabNavigation: ReturnType<typeof vi.fn>;
      refreshOneTab: ReturnType<typeof vi.fn>;
    };
    refreshMainMenu: ReturnType<typeof vi.fn>;
  };

  const addWindow = (window: MockWindow) => {
    windowRegistry.set(window.id, window);
  };

  const addTab = (entry: MockBrowserResult) => {
    tabRegistry.set(entry.tab.id, entry);
    if (!entry.desktop.tabs.some((t) => t.id === entry.tab.id)) {
      entry.desktop.tabs.push(entry.tab);
    }
  };

  const removeWindow = (id: TWindowId) => {
    windowRegistry.delete(id);
  };

  const removeTab = (id: TTabId) => {
    const entry = tabRegistry.get(id);
    if (!entry) return;
    entry.desktop.tabs = entry.desktop.tabs.filter((t) => t.id !== id);
    tabRegistry.delete(id);
  };

  return {
    browser,
    refreshDesktops,
    refreshURLBar,
    refreshTabNavigation,
    refreshOneTab,
    refreshMainMenu,
    addWindow,
    addTab,
    removeWindow,
    removeTab,
  };
}

// Build a real Tab-like value for refreshUrlBarOrTab/refreshTabAttentionState.
// The functions only read .id, so a minimal stub is enough.
function tabLike(id: TTabId): Tab {
  return { id } as unknown as Tab;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('coalesced refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('queues multiple refreshUrlBarOrTab calls in the same macrotask into one flush', () => {
    const h = createHarness();
    const desktop = createMockDesktop(1);
    const window = createMockWindow(1, desktop);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop });
    h.addTab({ tab: { id: 20 }, window, desktop });
    h.addTab({ tab: { id: 30 }, window, desktop });

    refreshUrlBarOrTab(h.browser, tabLike(10));
    refreshUrlBarOrTab(h.browser, tabLike(20));
    refreshUrlBarOrTab(h.browser, tabLike(30));

    // Nothing flushed yet — coalesce window is still pending.
    expect(h.refreshOneTab).not.toHaveBeenCalled();
    expect(h.refreshMainMenu).not.toHaveBeenCalled();

    vi.runAllTimers();

    expect(h.refreshOneTab).toHaveBeenCalledTimes(3);
    expect(h.refreshOneTab).toHaveBeenCalledWith(window, desktop, { id: 10 });
    expect(h.refreshOneTab).toHaveBeenCalledWith(window, desktop, { id: 20 });
    expect(h.refreshOneTab).toHaveBeenCalledWith(window, desktop, { id: 30 });
    expect(h.refreshMainMenu).toHaveBeenCalledTimes(1);
  });

  it('deduplicates the same tab id across multiple refreshUrlBarOrTab calls', () => {
    const h = createHarness();
    const desktop = createMockDesktop(1);
    const window = createMockWindow(1, desktop);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop });

    refreshUrlBarOrTab(h.browser, tabLike(10));
    refreshUrlBarOrTab(h.browser, tabLike(10));
    refreshUrlBarOrTab(h.browser, tabLike(10));
    refreshUrlBarOrTab(h.browser, tabLike(10));
    refreshUrlBarOrTab(h.browser, tabLike(10));

    vi.runAllTimers();

    expect(h.refreshOneTab).toHaveBeenCalledTimes(1);
    expect(h.refreshOneTab).toHaveBeenCalledWith(window, desktop, { id: 10 });
  });

  it('OR-merges refreshDesktops across refreshUrlBarOrTab + refreshTabAttentionState in the same flush', () => {
    const h = createHarness();
    const desktop = createMockDesktop(1);
    const window = createMockWindow(1, desktop);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop });
    h.addTab({ tab: { id: 20 }, window, desktop });

    refreshUrlBarOrTab(h.browser, tabLike(10));
    refreshTabAttentionState(h.browser, tabLike(20));

    vi.runAllTimers();

    // refreshDesktops must fire exactly once even though refreshTabAttentionState
    // was the only caller that asked for it.
    expect(h.refreshDesktops).toHaveBeenCalledTimes(1);
    expect(h.refreshDesktops).toHaveBeenCalledWith(window);
    expect(h.refreshOneTab).toHaveBeenCalledTimes(2);
  });

  it('skips the flush silently when the window no longer exists', () => {
    const h = createHarness();
    const desktop = createMockDesktop(1);
    const window = createMockWindow(1, desktop);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop });

    refreshUrlBarOrTab(h.browser, tabLike(10));
    // Window goes away between queue and flush (e.g. user closed it).
    h.removeWindow(1);

    vi.runAllTimers();

    expect(h.refreshOneTab).not.toHaveBeenCalled();
    expect(h.refreshURLBar).not.toHaveBeenCalled();
    expect(h.refreshMainMenu).not.toHaveBeenCalled();
  });

  it('skips per-tab refresh when the tab no longer exists but still flushes the rest', () => {
    const h = createHarness();
    const desktop = createMockDesktop(1);
    const window = createMockWindow(1, desktop);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop });
    h.addTab({ tab: { id: 20 }, window, desktop });

    refreshUrlBarOrTab(h.browser, tabLike(10));
    refreshUrlBarOrTab(h.browser, tabLike(20));
    // tab 10 vanishes between queue and flush.
    h.removeTab(10);

    vi.runAllTimers();

    expect(h.refreshOneTab).toHaveBeenCalledTimes(1);
    expect(h.refreshOneTab).toHaveBeenCalledWith(window, desktop, { id: 20 });
  });

  it('does not leak the queue between batches (second batch is independent)', () => {
    const h = createHarness();
    const desktop = createMockDesktop(1);
    const window = createMockWindow(1, desktop);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop });
    h.addTab({ tab: { id: 20 }, window, desktop });

    refreshUrlBarOrTab(h.browser, tabLike(10));
    vi.runAllTimers();
    expect(h.refreshOneTab).toHaveBeenCalledTimes(1);

    refreshUrlBarOrTab(h.browser, tabLike(20));
    vi.runAllTimers();
    // Second batch must not include the first batch's tab.
    expect(h.refreshOneTab).toHaveBeenCalledTimes(2);
    expect(h.refreshOneTab).toHaveBeenNthCalledWith(2, window, desktop, { id: 20 });
  });

  it('refreshes URL bar + tab navigation when the selected tab is in the queue', () => {
    const h = createHarness();
    const desktop = createMockDesktop(1, 10);
    const window = createMockWindow(1, desktop);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop });

    refreshUrlBarOrTab(h.browser, tabLike(10));

    vi.runAllTimers();

    expect(h.refreshURLBar).toHaveBeenCalledTimes(1);
    expect(h.refreshURLBar).toHaveBeenCalledWith(window, { id: 10 });
    expect(h.refreshTabNavigation).toHaveBeenCalledTimes(1);
    expect(h.refreshTabNavigation).toHaveBeenCalledWith(window, { id: 10 });
    expect(h.refreshOneTab).toHaveBeenCalledTimes(1);
  });

  it('does NOT refresh URL bar + tab navigation when only non-selected tabs are in the queue', () => {
    const h = createHarness();
    // Selected tab is 10; queue contains 20 (background) and 30 (background).
    const desktop = createMockDesktop(1, 10);
    const window = createMockWindow(1, desktop);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop });
    h.addTab({ tab: { id: 20 }, window, desktop });
    h.addTab({ tab: { id: 30 }, window, desktop });

    refreshUrlBarOrTab(h.browser, tabLike(20));
    refreshUrlBarOrTab(h.browser, tabLike(30));

    vi.runAllTimers();

    expect(h.refreshURLBar).not.toHaveBeenCalled();
    expect(h.refreshTabNavigation).not.toHaveBeenCalled();
    expect(h.refreshOneTab).toHaveBeenCalledTimes(2);
  });

  it('does NOT refresh a tab that lives on a non-selected desktop', () => {
    const h = createHarness();
    const desktopA = createMockDesktop(1, 10); // selected
    const desktopB = createMockDesktop(2);
    const window = createMockWindow(1, desktopA);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop: desktopA });
    h.addTab({ tab: { id: 99 }, window, desktop: desktopB });

    refreshUrlBarOrTab(h.browser, tabLike(99));

    vi.runAllTimers();

    expect(h.refreshOneTab).not.toHaveBeenCalled();
    expect(h.refreshMainMenu).not.toHaveBeenCalled();
  });

  it('refreshTabAttentionState triggers refreshDesktops AND refreshOneTab', () => {
    const h = createHarness();
    const desktop = createMockDesktop(1);
    const window = createMockWindow(1, desktop);
    h.addWindow(window);
    h.addTab({ tab: { id: 10 }, window, desktop });

    refreshTabAttentionState(h.browser, tabLike(10));

    vi.runAllTimers();

    expect(h.refreshDesktops).toHaveBeenCalledTimes(1);
    expect(h.refreshDesktops).toHaveBeenCalledWith(window);
    expect(h.refreshOneTab).toHaveBeenCalledTimes(1);
    expect(h.refreshOneTab).toHaveBeenCalledWith(window, desktop, { id: 10 });
  });

  it('refreshUrlBarOrTab for an unknown tab id is a no-op (does not schedule a flush)', () => {
    const h = createHarness();

    refreshUrlBarOrTab(h.browser, tabLike(999));

    // setTimeout is only scheduled when a real entry is queued; the helper
    // returns early before the timer fires. Run all timers to confirm no
    // refresh is emitted.
    vi.runAllTimers();
    expect(h.refreshOneTab).not.toHaveBeenCalled();
    expect(h.refreshDesktops).not.toHaveBeenCalled();
  });

  it('flushes both windows in a single setTimeout tick (cross-window coalesce)', () => {
    const h = createHarness();
    const desktopA = createMockDesktop(1, 10);
    const desktopB = createMockDesktop(2, 20);
    const windowA = createMockWindow(1, desktopA);
    const windowB = createMockWindow(2, desktopB);
    h.addWindow(windowA);
    h.addWindow(windowB);
    h.addTab({ tab: { id: 10 }, window: windowA, desktop: desktopA });
    h.addTab({ tab: { id: 20 }, window: windowB, desktop: desktopB });

    refreshUrlBarOrTab(h.browser, tabLike(10));
    refreshUrlBarOrTab(h.browser, tabLike(20));

    vi.runAllTimers();

    // One timer, both windows processed.
    expect(h.refreshOneTab).toHaveBeenCalledTimes(2);
    expect(h.refreshOneTab).toHaveBeenCalledWith(windowA, desktopA, { id: 10 });
    expect(h.refreshOneTab).toHaveBeenCalledWith(windowB, desktopB, { id: 20 });
    // refreshMainMenu is invoked per-window that had any change (so 2 here).
    expect(h.refreshMainMenu).toHaveBeenCalledTimes(2);
  });
});
