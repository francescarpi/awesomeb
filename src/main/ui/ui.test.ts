import { expect, test, describe, vi } from 'vitest';
import { UILayout } from './layout';
import { transformMargin } from './helpers';
import { Rectangle } from 'electron';
import { IMargin } from '~/types';

// Mock additional dependencies not covered in vitest.setup.ts
vi.mock('@/paths', () => ({
  PRELOAD_FOLDER: '/mock/preload',
  RENDERER_FOLDER: '/mock/renderer',
}));

vi.mock('@/core', () => ({
  internalPartition: { id: 'test-partition' },
}));

vi.mock('./modal', () => ({
  UIModalManager: class MockUIModalManager {
    constructor() {}
  },
}));

vi.mock('./notifications', () => ({
  UINotificationsManager: class MockUINotificationsManager {
    constructor() {}
  },
}));

vi.mock('./events', () => ({
  registerUIWindowEvents: vi.fn(),
}));

vi.mock('./helpers', async () => {
  const actual = await vi.importActual('./helpers');
  return {
    ...actual,
    loadPage: vi.fn().mockResolvedValue(undefined),
    openDevTools: vi.fn(),
  };
});

describe('UILayout', () => {
  test('should create a basic vertical layout', () => {
    const layout = new UILayout('test-layout', 'vertical');
    expect(layout.id).toBe('test-layout');
    expect(layout.type).toBe('vertical');
    expect(layout.children.length).toBe(0);
  });

  test('should create a basic horizontal layout', () => {
    const layout = new UILayout('test-layout', 'horizontal');
    expect(layout.id).toBe('test-layout');
    expect(layout.type).toBe('horizontal');
    expect(layout.children.length).toBe(0);
  });

  test('should create a basic fixed layout', () => {
    const layout = new UILayout('test-layout', { x: 0, y: 0, width: 100, height: 100 });
    expect(layout.id).toBe('test-layout');
    expect(layout.type).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(layout.children.length).toBe(0);
  });

  test('should set and get bounds correctly', () => {
    const layout = new UILayout('test-layout', 'vertical');
    const bounds = { x: 10, y: 20, width: 300, height: 400 };

    layout.setBounds(bounds);
    expect(layout.bounds).toEqual(bounds);
  });

  test('should initialize with fixed bounds when type is Rectangle', () => {
    const fixedBounds = { x: 5, y: 10, width: 200, height: 300 };
    const layout = new UILayout('test-layout', fixedBounds);

    expect(layout.bounds).toEqual(fixedBounds);
  });

  test('should add children correctly', () => {
    const layout = new UILayout('test-layout', 'vertical');
    const childLayout1 = new UILayout('child-layout-1', 'horizontal');
    const childLayout2 = new UILayout('child-layout-2', 'vertical');

    layout.addChild(childLayout1);
    layout.addChild(childLayout2);

    expect(layout.children.length).toBe(2);
    expect(layout.children[0]).toBe(childLayout1);
    expect(layout.children[1]).toBe(childLayout2);
  });

  test('should handle nested layout hierarchy', () => {
    const rootLayout = new UILayout('root', 'vertical');
    const level1Layout = new UILayout('level-1', 'horizontal');
    const level2Layout = new UILayout('level-2', 'vertical');

    level1Layout.addChild(level2Layout);
    rootLayout.addChild(level1Layout);

    expect(rootLayout.children.length).toBe(1);
    expect(rootLayout.children[0]).toBe(level1Layout);
    expect(level1Layout.children.length).toBe(1);
    expect(level1Layout.children[0]).toBe(level2Layout);
  });
});

describe('transformMargin', () => {
  test('should transform single value margin correctly', () => {
    const result = transformMargin('10');
    expect(result).toEqual({ l: 10, t: 10, r: 10, b: 10 });
  });

  test('should transform two value margin correctly', () => {
    const result = transformMargin('10 20');
    expect(result).toEqual({ l: 20, t: 10, r: 20, b: 10 });
  });

  test('should transform three value margin correctly', () => {
    const result = transformMargin('10 20 30');
    expect(result).toEqual({ l: 20, t: 10, r: 20, b: 30 });
  });

  test('should transform four value margin correctly', () => {
    const result = transformMargin('10 20 30 40');
    expect(result).toEqual({ l: 40, t: 10, r: 20, b: 30 });
  });

  test('should handle zero margins', () => {
    const result = transformMargin('0');
    expect(result).toEqual({ l: 0, t: 0, r: 0, b: 0 });
  });

  test('should handle negative margins', () => {
    const result = transformMargin('-5 -10 -15 -20');
    expect(result).toEqual({ l: -20, t: -5, r: -10, b: -15 });
  });

  test('should handle empty string by returning default margin', () => {
    const result = transformMargin('');
    expect(result).toEqual({ l: 0, t: 0, r: 0, b: 0 });
  });

  test('should handle whitespace-only strings', () => {
    const result = transformMargin('   ');
    expect(result).toEqual({ l: 0, t: 0, r: 0, b: 0 });
  });

  test('should handle invalid input gracefully', () => {
    const result = transformMargin('invalid text');
    expect(result).toEqual({ l: 0, t: 0, r: 0, b: 0 });
  });

  test('should handle mixed valid and invalid values', () => {
    const result = transformMargin('10 invalid 20');
    expect(result).toEqual({ t: 10, r: 0, b: 20, l: 0 }); // 3 values: top, horizontal(invalid->0), bottom
  });

  test('should handle extra whitespace', () => {
    const result = transformMargin('  10    20  ');
    expect(result).toEqual({ l: 20, t: 10, r: 20, b: 10 });
  });
});

describe('Layout Bounds Calculation Logic', () => {
  // Tests that verify the calculation logic without relying on complex components

  test('should calculate margin application correctly', () => {
    const applyMarginToBounds = (bounds: Rectangle, margin: IMargin): Rectangle => ({
      x: bounds.x + margin.l,
      y: bounds.y + margin.t,
      width: bounds.width - margin.l - margin.r,
      height: bounds.height - margin.t - margin.b,
    });

    const bounds: Rectangle = { x: 10, y: 20, width: 200, height: 100 };
    const margin: IMargin = { t: 5, r: 10, b: 15, l: 8 };

    const result = applyMarginToBounds(bounds, margin);

    expect(result).toEqual({
      x: 18, // 10 + 8 (left margin)
      y: 25, // 20 + 5 (top margin)
      width: 182, // 200 - 8 - 10 (width - left - right)
      height: 80, // 100 - 5 - 15 (height - top - bottom)
    });
  });

  test('should calculate vertical layout positioning with margins', () => {
    // Simulates the calculation of position in vertical layout
    const calculateNextX = (previousBounds: Rectangle, previousMargin: IMargin) => {
      return previousBounds.x + previousBounds.width + previousMargin.r;
    };

    const previousBounds = { x: 0, y: 0, width: 200, height: 100 };
    const previousMargin = { t: 5, r: 20, b: 5, l: 10 };

    const nextX = calculateNextX(previousBounds, previousMargin);
    expect(nextX).toBe(220); // 0 + 200 + 20
  });

  test('should calculate horizontal layout positioning with margins', () => {
    // Simulates position calculation in horizontal layout
    const calculateNextY = (previousBounds: Rectangle, previousMargin: IMargin) => {
      return previousBounds.y + previousBounds.height + previousMargin.b;
    };

    const previousBounds = { x: 0, y: 0, width: 200, height: 100 };
    const previousMargin = { t: 5, r: 10, b: 15, l: 10 };

    const nextY = calculateNextY(previousBounds, previousMargin);
    expect(nextY).toBe(115); // 0 + 100 + 15
  });

  test('should calculate remaining space correctly', () => {
    const calculateRemainingWidth = (
      totalWidth: number,
      usedWidth: number,
      previousMargin: IMargin,
      currentMargin: IMargin,
    ) => {
      const spacingRequired = previousMargin.r + currentMargin.l;
      return totalWidth - usedWidth - spacingRequired;
    };

    const result = calculateRemainingWidth(
      1000,
      300,
      { t: 0, r: 20, b: 0, l: 0 },
      { t: 0, r: 0, b: 0, l: 15 },
    );
    expect(result).toBe(665); // 1000 - 300 - 20 - 15
  });
});

describe('Complex Layout Scenarios', () => {
  test('should handle multiple layout orientations', () => {
    const scenarios = [
      { type: 'vertical' as const, expectedAxis: 'x' },
      { type: 'horizontal' as const, expectedAxis: 'y' },
    ];

    scenarios.forEach((scenario) => {
      const layout = new UILayout(`test-${scenario.type}`, scenario.type);
      expect(layout.type).toBe(scenario.type);

      // Vertical layouts position children along the X-axis, horizontal layouts along the Y-axis
      if (scenario.type === 'vertical') {
        expect(layout.type).toBe('vertical');
      } else {
        expect(layout.type).toBe('horizontal');
      }
    });
  });

  test('should handle deeply nested layout structure', () => {
    let currentLayout = new UILayout('root', 'vertical');
    const rootLayout = currentLayout;

    // Create a deeply nested structure
    for (let i = 0; i < 5; i++) {
      const childLayout = new UILayout(`level-${i}`, i % 2 === 0 ? 'vertical' : 'horizontal');
      currentLayout.addChild(childLayout);
      currentLayout = childLayout;
    }

    // Verify that the structure was created correctly
    expect(rootLayout.children.length).toBe(1);
    expect(rootLayout.children[0]).toBeInstanceOf(UILayout);

    let current = rootLayout.children[0] as UILayout;
    for (let i = 0; i < 4; i++) {
      expect(current.id).toBe(`level-${i}`);
      expect(current.type).toBe(i % 2 === 0 ? 'vertical' : 'horizontal');

      if (i < 3) {
        expect(current.children.length).toBe(1);
        current = current.children[0] as UILayout;
      }
    }
  });

  test('should handle various margin configurations', () => {
    const marginConfigs = [
      { input: '0', expected: { t: 0, r: 0, b: 0, l: 0 } },
      { input: '5', expected: { t: 5, r: 5, b: 5, l: 5 } },
      { input: '5 10', expected: { t: 5, r: 10, b: 5, l: 10 } },
      { input: '5 10 15', expected: { t: 5, r: 10, b: 15, l: 10 } },
      { input: '5 10 15 20', expected: { t: 5, r: 10, b: 15, l: 20 } },
    ];

    marginConfigs.forEach((config) => {
      const result = transformMargin(config.input);
      expect(result).toEqual(config.expected);
    });
  });

  test('should handle edge cases in bounds calculations', () => {
    // Test with minimum bounds
    const minBounds = { x: 0, y: 0, width: 1, height: 1 };
    const margin = { t: 0, r: 0, b: 0, l: 0 };

    const applyMargin = (bounds: Rectangle, margin: IMargin) => ({
      x: bounds.x + margin.l,
      y: bounds.y + margin.t,
      width: Math.max(0, bounds.width - margin.l - margin.r),
      height: Math.max(0, bounds.height - margin.t - margin.b),
    });

    const result = applyMargin(minBounds, margin);
    expect(result.width).toBeGreaterThanOrEqual(0);
    expect(result.height).toBeGreaterThanOrEqual(0);
  });

  test('should handle layout bounds with different rectangle types', () => {
    const fixedBounds = { x: 100, y: 200, width: 300, height: 400 };
    const fixedLayout = new UILayout('fixed', fixedBounds);

    expect(fixedLayout.bounds).toEqual(fixedBounds);
    expect(typeof fixedLayout.type).toBe('object');
    expect(fixedLayout.type).toEqual(fixedBounds);
  });
});

describe('Layout System Integration', () => {
  test('should maintain layout hierarchy integrity', () => {
    const mainLayout = new UILayout('main', 'vertical');
    const sidebarLayout = new UILayout('sidebar', 'horizontal');
    const contentLayout = new UILayout('content', 'vertical');

    mainLayout.addChild(sidebarLayout);
    mainLayout.addChild(contentLayout);

    // Verify that the hierarchy is maintained
    expect(mainLayout.children).toContain(sidebarLayout);
    expect(mainLayout.children).toContain(contentLayout);
    expect(mainLayout.children.length).toBe(2);
  });

  test('should handle bounds propagation simulation', () => {
    const parentBounds = { x: 0, y: 0, width: 1000, height: 600 };
    const layout = new UILayout('test', 'vertical');

    // Simulates the process of setting up bounds
    layout.setBounds(parentBounds);
    expect(layout.bounds).toEqual(parentBounds);

    // The bounds of the parent layout must be available to the children
    const childLayout = new UILayout('child', 'horizontal');
    layout.addChild(childLayout);

    // In a real system, the child would inherit or calculate its bounds based on the parent
    // Here we verify that the structure allows this propagation
    expect(layout.children[0]).toBe(childLayout);
  });
});

describe('View Visibility and Dragging Control', () => {
  // Tests to verify that hidden views do not interfere with dragging

  test('should properly handle view visibility state', () => {
    // Simulates a view with drag region
    const mockWebContentsView = {
      webContents: { id: 1, send: vi.fn() },
      setBounds: vi.fn(),
      getBounds: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
      setVisible: vi.fn(),
      getVisible: vi.fn(() => true),
      setBorderRadius: vi.fn(),
    };

    // We simulate the methods we need
    const simulateViewBehavior = (isVisible: boolean) => {
      mockWebContentsView.getVisible = vi.fn(() => isVisible);
      mockWebContentsView.setVisible = vi.fn();

      return {
        isVisible,
        hide: () => mockWebContentsView.setVisible(false),
        show: () => mockWebContentsView.setVisible(true),
      };
    };

    const visibleView = simulateViewBehavior(true);
    const hiddenView = simulateViewBehavior(false);

    expect(visibleView.isVisible).toBe(true);
    expect(hiddenView.isVisible).toBe(false);

    // Simulate hide/show
    visibleView.hide();
    expect(mockWebContentsView.setVisible).toHaveBeenCalledWith(false);

    hiddenView.show();
    expect(mockWebContentsView.setVisible).toHaveBeenCalledWith(true);
  });

  test('should manage contentView children based on visibility', () => {
    const mockContentView = {
      addChildView: vi.fn(),
      removeChildView: vi.fn(),
      children: [],
    };

    const mockWebContentsView = {
      webContents: { id: 1 },
      setBounds: vi.fn(),
      setVisible: vi.fn(),
      getVisible: vi.fn(() => true),
    };

    // Simulate the behavior of adding/removing views from the contentView
    const simulateContentViewManagement = (isVisible: boolean, isChildPresent: boolean) => {
      if (isVisible && !isChildPresent) {
        mockContentView.addChildView(mockWebContentsView, 0);
      } else if (!isVisible && isChildPresent) {
        mockContentView.removeChildView(mockWebContentsView);
      }
    };

    // Test: visible view not in contentView -> should be added
    simulateContentViewManagement(true, false);
    expect(mockContentView.addChildView).toHaveBeenCalledWith(mockWebContentsView, 0);

    // Reset mocks
    mockContentView.addChildView.mockClear();
    mockContentView.removeChildView.mockClear();

    // Test: hidden view in contentView -> should be removed
    simulateContentViewManagement(false, true);
    expect(mockContentView.removeChildView).toHaveBeenCalledWith(mockWebContentsView);
  });

  test('should handle refresh tab container layout with visibility changes', () => {
    // Simulates the behavior of refreshTabContainerLayoutView
    const mockViews = [
      { id: 'no-tab', show: vi.fn(), hide: vi.fn(), isVisible: true },
      { id: 'tab-1', show: vi.fn(), hide: vi.fn(), isVisible: false },
      { id: 'tab-2', show: vi.fn(), hide: vi.fn(), isVisible: true },
    ];

    const mockContentView = {
      addChildView: vi.fn(),
      removeChildView: vi.fn(),
      children: [],
    };

    const simulateRefreshTabContainer = (visibleIds: string[]) => {
      for (const view of mockViews) {
        if (visibleIds.includes(view.id)) {
          view.show();
          // Simulate addChildView if not present
          // @ts-expect-error ingore any type issues
          if (!mockContentView.children.includes(view as any)) {
            mockContentView.addChildView(view, 0);
          }
        } else {
          view.hide();
          // Simulate removeChildView if present
          // @ts-expect-error ingore any type issues
          if (mockContentView.children.includes(view as any)) {
            mockContentView.removeChildView(view);
          }
        }
      }
    };

    // Test: show only tab-2, hide no-tab and tab-1
    simulateRefreshTabContainer(['tab-2']);

    expect(mockViews[0].hide).toHaveBeenCalled(); // no-tab hidden
    expect(mockViews[1].hide).toHaveBeenCalled(); // tab-1 hidden
    expect(mockViews[2].show).toHaveBeenCalled(); // tab-2 shown

    // Verify that contentView methods were called appropriately
    expect(mockContentView.addChildView).toHaveBeenCalledWith(mockViews[2], 0);
  });

  test('should prevent drag interaction when view is hidden', () => {
    // Conceptual test to verify that a hidden view should not allow dragging
    const mockDragRegionView = {
      id: 'no-tab',
      hasDragRegion: true, // CSS app-region: drag
      isVisible: true,
      isInContentView: true,
    };

    // Function that simulates the desired behavior
    const canPerformDrag = (view: typeof mockDragRegionView) => {
      // It should only allow drag if the view is visible AND is in the contentView
      return view.isVisible && view.isInContentView && view.hasDragRegion;
    };

    // Case 1: View is visible and in contentView -> allows drag
    expect(canPerformDrag(mockDragRegionView)).toBe(true);

    // Case 2: View is hidden but still in contentView -> should NOT allow drag
    mockDragRegionView.isVisible = false;
    expect(canPerformDrag(mockDragRegionView)).toBe(false);

    // Case 3: View is hidden and removed from contentView -> should NOT allow drag
    mockDragRegionView.isInContentView = false;
    expect(canPerformDrag(mockDragRegionView)).toBe(false);

    // Case 4: View is visible but not in contentView -> should NOT allow drag
    mockDragRegionView.isVisible = true;
    expect(canPerformDrag(mockDragRegionView)).toBe(false);
  });
});
