# Layout Space Distribution

## Overview

The layout system now supports automatic space distribution among multiple flexible children (layouts and views without explicit size).

## How It Works

### Vertical Layouts

In a **vertical layout**, children are positioned from left to right. The available **width** is distributed among flexible children.

- **Fixed-width views**: Use their explicit `width` property
- **Flexible children**: Share the remaining width equally
  - Layouts (always flexible, no explicit width/height)
  - Views without explicit width

### Horizontal Layouts

In a **horizontal layout**, children are positioned from top to bottom. The available **height** is distributed among flexible children.

- **Fixed-height views**: Use their explicit `height` property
- **Flexible children**: Share the remaining height equally
  - Layouts (always flexible, no explicit width/height)
  - Views without explicit height

## Examples

### Example 1: Two Layouts Side by Side

```typescript
const mainLayout = new UILayout('main', 'vertical');
const layout1 = new UILayout('layout-1', 'horizontal');
const layout2 = new UILayout('layout-2', 'horizontal');

mainLayout.addChild(layout1);
mainLayout.addChild(layout2);

// If mainLayout width = 1000px
// layout1 gets 500px width
// layout2 gets 500px width
```

### Example 2: Mixed Fixed and Flexible

```typescript
const mainLayout = new UILayout('main', 'vertical');
const sidebar = new UIPageView('sidebar', { width: 200 }); // Fixed width
const content = new UILayout('content', 'horizontal'); // Flexible
const panel = new UILayout('panel', 'horizontal'); // Flexible

mainLayout.addChild(sidebar);
mainLayout.addChild(content);
mainLayout.addChild(panel);

// If mainLayout width = 1000px
// sidebar gets 200px (fixed)
// content gets 400px (flexible, shares 800px with panel)
// panel gets 400px (flexible, shares 800px with content)
```

### Example 3: Three Layouts with Margins

```typescript
const mainLayout = new UILayout('main', 'horizontal');
const urlbar = new UIPageView('urlbar', { height: 40 }); // Fixed height
const tabContainer = new UILayout('tabs', 'vertical'); // Flexible
const bottomLayout = new UILayout('bottom', 'vertical'); // Flexible

mainLayout.addChild(urlbar);
mainLayout.addChild(tabContainer);
mainLayout.addChild(bottomLayout);

// If mainLayout height = 600px
// urlbar gets 40px (fixed)
// tabContainer gets 280px (flexible, shares 560px with bottomLayout)
// bottomLayout gets 280px (flexible, shares 560px with tabContainer)
```

### Example 4: Complex Scenario

```typescript
const mainLayout = new UILayout('main', 'vertical');
const sidebar = new UIPageView('sidebar', { width: 200, margin: '0 10 0 0' }); // Fixed: 200px + 10px right margin
const view1 = new UIPageView('view1'); // Flexible (no width)
const layout1 = new UILayout('layout-1', 'horizontal'); // Flexible
const layout2 = new UILayout('layout-2', 'horizontal'); // Flexible

mainLayout.addChild(sidebar);
mainLayout.addChild(view1);
mainLayout.addChild(layout1);
mainLayout.addChild(layout2);

// If mainLayout width = 1000px
// sidebar uses 210px (200px width + 10px right margin)
// Remaining: 790px shared among 3 flexible children
// view1 gets ~263.33px
// layout1 gets ~263.33px
// layout2 gets ~263.33px
```

## Key Points

1. **Layouts are always flexible** - They don't have explicit width/height properties
2. **Views can be fixed or flexible** - Depends on whether they have explicit width (vertical parent) or height (horizontal parent)
3. **Margins are accounted for** - Fixed-size views include their margins in space calculation
4. **Equal distribution** - All flexible children get an equal share of the available space
5. **Visible children only** - Only visible views are considered in the calculation

## Implementation Details

The space distribution is calculated by the `_calculateFlexibleChildren()` method, which:

1. Counts flexible children (layouts + views without explicit size)
2. Sums up space used by fixed-size children (including margins)
3. Calculates remaining available space
4. Divides available space equally among flexible children

This calculation happens during the render phase and is used by `_calculateLayoutBounds()` and `_calculateViewBounds()` methods.
