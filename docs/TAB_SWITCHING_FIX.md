# Tab Switching Fix - Layout Cleanup

## Problem Description

When switching between tabs using `selectTab()`, the previous tab's view remained visible while the new tab was also displayed. This created a visual bug where both tabs were overlapping.

### Root Cause

The issue occurred in the following sequence:

1. **Line 164 of window.ts**: `removeFromMainLayout(selectedTabContainer.layout)` was called
   - This removed the layout from the logical structure
   - **BUT did not call `renderLayout()`**
   - Views remained in the `BrowserWindow.contentView`

2. **Line 194**: `addIntoMainLayout(tabContainer.layout)` was called
   - This added the new layout and called `renderLayout()`
   - Now both old and new layouts' views were in contentView
   - Result: Both tabs visible simultaneously

## Solution

### 1. Render on Layout Removal

Modified `removeFromMainLayout()` to call `renderLayout()`:

```typescript
removeFromMainLayout(layout: UILayout) {
  const mainLayout = this.getChild<UILayout>('main-layout')!;
  mainLayout.removeChild(layout);
  scopeLog.debug('Removed layout from main layout:', layout.id);
  this.renderLayout(); // ← Added this line
}
```

### 2. Automatic Cleanup of Orphaned Views

Added automatic cleanup mechanism that runs during every root render:

```typescript
renderLayout(parentLayout?: UILayout, parentBounds?: Rectangle) {
  const layout = parentLayout || this._rootLayout!;
  
  this._setupLayoutBounds(layout, parentBounds);
  this._renderLayoutChildren(layout);
  
  // Only clean up orphaned views when rendering from root
  if (!parentLayout) {
    this._cleanupOrphanedViews(); // ← Added cleanup
  }
}
```

### 3. Helper Methods

#### `_collectAllViewsInTree()`

Recursively collects all views that should be in the layout tree:

```typescript
private _collectAllViewsInTree(layout?: UILayout): Set<UIView> {
  const views = new Set<UIView>();
  const currentLayout = layout || this._rootLayout!;

  for (const child of currentLayout.children) {
    if (child instanceof UILayout) {
      // Recursively collect views from child layouts
      const childViews = this._collectAllViewsInTree(child);
      childViews.forEach(view => views.add(view));
    } else if (child instanceof UIView) {
      views.add(child);
    }
  }

  return views;
}
```

#### `_cleanupOrphanedViews()`

Removes views from contentView that are no longer in the layout tree:

```typescript
private _cleanupOrphanedViews() {
  const viewsInTree = this._collectAllViewsInTree();
  const viewsInContentView = this.bw.contentView.children;

  for (const webContentsView of viewsInContentView) {
    // Check if this webContentsView belongs to a view in our tree
    let foundInTree = false;
    for (const view of viewsInTree) {
      if (view.webContentsView === webContentsView) {
        foundInTree = true;
        break;
      }
    }

    // If not found in tree, remove it from contentView
    if (!foundInTree) {
      this.bw.contentView.removeChildView(webContentsView);
      scopeLog.debug('Cleaned up orphaned view from contentView');
    }
  }
}
```

## Correct Flow Now

When `selectTab(tabId)` is called:

1. Get the previously selected tab container
2. `removeFromMainLayout(oldLayout)`
   - Removes layout from tree
   - **Calls `renderLayout()`**
   - **Cleanup removes orphaned views from contentView**
3. Update internal state (desktop, tabContainer, tab selection)
4. `addIntoMainLayout(newLayout)`
   - Adds new layout to tree
   - Renders and displays new layout
5. **Only the new tab's views are in contentView**

## Benefits

- ✅ **Immediate cleanup**: Views are removed as soon as layouts are removed
- ✅ **Automatic**: No manual tracking of which views to remove
- ✅ **Recursive**: Handles nested layouts correctly
- ✅ **Safe**: Only removes views not in the current tree
- ✅ **Efficient**: Cleanup only runs on root renders

## Testing

Added 4 new test cases:

1. **Orphaned view removal**: Validates views are removed when not in tree
2. **Recursive collection**: Ensures all views in nested layouts are found
3. **Layout switching**: Simulates the selectTab scenario
4. **Multiple switches**: Validates correct behavior across multiple tab changes

All tests pass, including existing ones, confirming no regressions.
