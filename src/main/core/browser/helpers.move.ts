import log from 'electron-log';
import { Browser } from '@/core';
import type { IWinDesConTab } from '~/types';
import type { IMoveTabProps } from './types';
import { parseTarget } from './helpers';

const scopeLog = log.scope('Browser.MoveHelpers');

/**
 * Handles the `'move-as-child'` target: the moved tab is placed inside a
 * brand-new child container of the requested parent. The parent is supplied
 * via `props.parentTabContainer` (resolved upstream by the menu — the renderer
 * hides the target unless a selectedTab with `openTabsAsChild` exists).
 *
 * If the source container ends up empty after the move, it is detached from
 * its parent and dropped from the index so the tree stays consistent.
 */
export function moveAsChild(
  browser: Browser,
  sourceData: IWinDesConTab,
  props?: IMoveTabProps,
): void {
  const parentTc = props?.parentTabContainer;
  if (!parentTc) {
    scopeLog.error(
      `move-as-child: 'parentTabContainer' is required in props for tab ${sourceData.tab.id}`,
    );
    return;
  }

  if (parentTc.id === sourceData.tabContainer.id) {
    scopeLog.warn(
      `move-as-child: tab ${sourceData.tab.id} is already in the requested parent container`,
    );
    return;
  }

  const parentData = browser.getTabContainer(parentTc.id);
  if (!parentData) {
    scopeLog.error(`move-as-child: parent tab container ${parentTc.id} not found in index`);
    return;
  }

  const sourceTc = sourceData.tabContainer;
  const sourceWindow = sourceData.window;
  const sourceDesktop = sourceData.desktop;
  const sourceTab = sourceData.tab;
  const targetWindow = parentData.window;
  const targetDesktop = parentData.desktop;

  // 1. Detach the tab from its current container. The container may still
  //    hold other tabs, so we only kill it later if it ends up empty.
  sourceTc.deleteTab(sourceTab.id);

  // 2. If the source container is now empty, drop it from the desktop
  //    and detach it from its parent so the tree stays consistent.
  if (sourceTc.tabs.length === 0) {
    if (sourceTc.parent) {
      sourceTc.parent.removeChild(sourceTc.id);
      sourceTc.setParent(null);
    }
    browser.unindexTabContainer(sourceTc.id);
    sourceDesktop.deleteTabContainer(sourceTc.id);
  }

  // 3. Create a brand-new child container under the parent's tabContainer.
  const newChildTc = parentTc.createChildTabContainer(browser.idGenerator.nextTabContainerId);
  browser.indexTabContainer(targetWindow, targetDesktop, newChildTc);

  // 4. Move the tab into the new child and reindex it to point there.
  newChildTc.addTab(sourceTab);
  browser.unindexTab(sourceTab.id);
  browser.indexTab(targetWindow, targetDesktop, newChildTc, sourceTab);

  // 5. If the source and target live in different windows, the
  //    WebContentsView must travel with the tab.
  if (sourceWindow.id !== targetWindow.id) {
    sourceWindow.removeView(sourceTab.viewId, false);
    targetWindow.addView(sourceTab);
  }

  // 6. Selection: A (the parent's tabContainer) stays as the desktop's
  //    selectedTabContainer so the root view doesn't jump. The tab itself
  //    is selected inside its new child, matching the split-tab behavior.
  if (props?.selectTab) {
    newChildTc.selectTab(sourceTab.id);
    targetDesktop.selectTabContainer(parentTc.id);
    targetWindow.selectDesktop(targetDesktop.id);
  }

  targetWindow.renderViews();
  if (sourceWindow.id !== targetWindow.id) {
    sourceWindow.renderViews();
  }

  browser.eventsChannel.emit(
    'browser:tab-did-move',
    newChildTc,
    sourceTab,
    sourceWindow,
    sourceDesktop,
    targetWindow,
    targetDesktop,
  );
}

/**
 * Handles the `'remove-from-parent'` target: detaches the source tab's
 * container from its parent and promotes it to top-level in the same
 * desktop. The moved tab's container keeps its own children (grandchildren
 * travel with it).
 */
export function removeFromParent(
  browser: Browser,
  sourceData: IWinDesConTab,
  props?: IMoveTabProps,
): void {
  const { tabContainer, window, desktop, tab } = sourceData;

  if (!tabContainer.parent) {
    scopeLog.warn(`Tab container with id ${tabContainer.id} has no parent to detach from`);
    return;
  }

  tabContainer.parent.removeChild(tabContainer.id);
  tabContainer.setParent(null);
  desktop.addTabContainer(tabContainer);

  if (props?.selectTab) {
    desktop.selectTabContainer(tabContainer.id);
    window.selectTab(tab.id);
  }

  window.renderViews();

  browser.eventsChannel.emit(
    'browser:tab-did-move',
    tabContainer,
    tab,
    window,
    desktop,
    window,
    desktop,
  );
}

/**
 * Handles any other `'move-tab'` target by going through `parseTarget`.
 * Handles cross-window, cross-desktop moves, the split-tab target and the
 * default targetIds (desktop-N, window-N).
 */
export function moveToTarget(
  browser: Browser,
  sourceData: IWinDesConTab,
  targetId: string,
  props?: IMoveTabProps,
): void {
  const targetData = parseTarget(browser, {
    targetId,
    partitionId: sourceData.tab.partition.id,
    tabContainer: sourceData.tabContainer,
  });

  if (!targetData) {
    scopeLog.error(`Invalid targetId provided for moving tab: ${targetId}`);
    return;
  }

  browser.indexTabContainer(targetData.window, targetData.desktop, targetData.tabContainer);

  // If the source tabContainer is a child of another container, detach it
  // before moving it. Otherwise the old parent keeps a stale reference in
  // its children map and the child still claims the old parent.
  if (sourceData.tabContainer.parent) {
    sourceData.tabContainer.parent.removeChild(sourceData.tabContainer.id);
    sourceData.tabContainer.setParent(null);
  }

  if (targetId === 'split-tab') {
    targetData.tabContainer.addTab(sourceData.tab);
    browser.indexTab(
      targetData.window,
      targetData.desktop,
      targetData.tabContainer,
      sourceData.tab,
    );

    if (props?.selectTab) {
      targetData.tabContainer.selectTab(sourceData.tab.id);
    }

    browser.unindexTabContainer(sourceData.tabContainer.id);
    sourceData.desktop.deleteTabContainer(sourceData.tabContainer.id);
    sourceData.window.renderViews();

    browser.eventsChannel.emit(
      'browser:tab-did-move',
      targetData.tabContainer,
      sourceData.tab,
      sourceData.window,
      sourceData.desktop,
      targetData.window,
      targetData.desktop,
    );
    return;
  }

  if (
    sourceData.window.id == targetData.window.id &&
    sourceData.desktop.id == targetData.desktop.id
  ) {
    scopeLog.warn('Tab is already in the target desktop/window');
    return;
  }

  browser.unindexTabContainer(sourceData.tabContainer.id);

  sourceData.desktop.deleteTabContainer(sourceData.tabContainer.id);
  targetData.desktop.addTabContainer(sourceData.tabContainer);

  browser.indexTabContainer(targetData.window, targetData.desktop, sourceData.tabContainer);

  for (const tab of sourceData.tabContainer.tabs) {
    browser.indexTab(targetData.window, targetData.desktop, sourceData.tabContainer, tab);
  }

  if (sourceData.window.id !== targetData.window.id) {
    scopeLog.info(
      'Source window is different to target',
      sourceData.window.id,
      targetData.window.id,
    );
    sourceData.window.removeView(sourceData.tab.viewId, false);
    targetData.window.addView(sourceData.tab);
    targetData.window.renderViews();
  }

  sourceData.window.renderViews();

  if (props?.selectTab) {
    targetData.window.selectTab(sourceData.tab.id);
  }

  browser.eventsChannel.emit(
    'browser:tab-did-move',
    sourceData.tabContainer,
    sourceData.tab,
    sourceData.window,
    sourceData.desktop,
    targetData.window,
    targetData.desktop,
  );
}
