import log from 'electron-log';
import { Browser, Desktop, TabContainer } from '@/core';
import type { IWinDesConTab, TTabContainerId, TTabId } from '~/types';

const scopeLog = log.scope('Browser.MovePositionHelpers');

export type TabMovePosition =
  | { kind: 'before-tab'; targetTabId: TTabId }
  | { kind: 'after-tab'; targetTabId: TTabId }
  | { kind: 'as-child'; targetTabId: TTabId }
  | { kind: 'out-of-container'; targetTabContainerId: TTabContainerId }
  | { kind: 'desktop' };

function findContainerOfTab(
  desktop: Desktop,
  tabId: TTabId,
): { container: TabContainer; index: number } | null {
  const walk = (tc: TabContainer): { container: TabContainer; index: number } | null => {
    const index = tc.tabs.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      return { container: tc, index };
    }
    for (const child of tc.children) {
      const found = walk(child);
      if (found) {
        return found;
      }
    }
    return null;
  };

  for (const tc of desktop.tabContainers) {
    const found = walk(tc);
    if (found) {
      return found;
    }
  }

  return null;
}

function findContainerById(desktop: Desktop, id: TTabContainerId): TabContainer | null {
  const walk = (tc: TabContainer): TabContainer | null => {
    if (tc.id === id) {
      return tc;
    }
    for (const child of tc.children) {
      const found = walk(child);
      if (found) {
        return found;
      }
    }
    return null;
  };

  for (const tc of desktop.tabContainers) {
    const found = walk(tc);
    if (found) {
      return found;
    }
  }

  return null;
}

function pruneEmptyContainer(browser: Browser, container: TabContainer, desktop: Desktop): boolean {
  if (container.tabs.length > 0) {
    return false;
  }

  if (container.parent) {
    container.parent.removeChild(container.id);
    container.setParent(null);
  } else {
    desktop.deleteTabContainer(container.id);
  }

  browser.unindexTabContainer(container.id);

  return true;
}

function moveTabIntoContainer(
  browser: Browser,
  sourceData: IWinDesConTab,
  targetContainer: TabContainer,
  index: number,
): void {
  const { tabContainer: sourceContainer, tab, window, desktop } = sourceData;

  if (sourceContainer === targetContainer) {
    sourceContainer.moveTabToIndex(tab.id, index);
    return;
  }

  sourceContainer.takeTab(tab.id);

  if (sourceContainer.tabs.length === 0) {
    pruneEmptyContainer(browser, sourceContainer, desktop);
  }

  targetContainer.insertTab(tab, index);

  browser.unindexTab(tab.id);
  browser.indexTab(window, desktop, targetContainer, tab);

  browser.eventsChannel.emit(
    'browser:tab-did-move',
    targetContainer,
    tab,
    window,
    desktop,
    window,
    desktop,
  );
}

function placeContainerAsSibling(
  browser: Browser,
  container: TabContainer,
  sibling: TabContainer,
  desktop: Desktop,
  index: number,
): void {
  const targetParent = sibling.parent;

  if (targetParent) {
    if (container.parent !== targetParent) {
      container.parent?.removeChild(container.id);
      container.setParent(targetParent);
      targetParent.addChild(container);
    }
    targetParent.moveChildToIndex(container.id, index);
  } else {
    if (container.parent) {
      container.parent.removeChild(container.id);
      container.setParent(null);
      desktop.addTabContainer(container);
    }
    desktop.moveTabContainerToIndex(container.id, index);
  }

  browser.eventsChannel.emit('desktop:tabcontainers-order-did-change', desktop.window, desktop);
}

function siblingIndex(
  container: TabContainer,
  sibling: TabContainer,
  desktop: Desktop,
  position: 'before-tab' | 'after-tab',
): number {
  const targetParent = sibling.parent;
  const siblings = targetParent ? targetParent.children : desktop.tabContainers;

  const withoutMoved = siblings.filter((c) => c.id !== container.id);
  const siblingIndex = withoutMoved.findIndex((c) => c.id === sibling.id);

  return position === 'before-tab' ? siblingIndex : siblingIndex + 1;
}

export function moveTabToPosition(
  browser: Browser,
  sourceData: IWinDesConTab,
  position: TabMovePosition,
): void {
  const { tabContainer: sourceContainer, tab, window, desktop } = sourceData;

  const source = findContainerOfTab(desktop, tab.id);
  if (!source) {
    scopeLog.error(`Tab ${tab.id} not found in the tree of desktop ${desktop.id}`);
    return;
  }

  switch (position.kind) {
    case 'before-tab':
    case 'after-tab': {
      const target = findContainerOfTab(desktop, position.targetTabId);
      if (!target) {
        scopeLog.error(`Target tab ${position.targetTabId} not found in desktop ${desktop.id}`);
        return;
      }

      if (target.container === source.container) {
        const base = target.index;
        const index = position.kind === 'before-tab' ? base : base + 1;
        source.container.moveTabToIndex(tab.id, index);
        return;
      }

      const targetContainer = target.container;

      if (source.container.tabs.length === 1) {
        const index = siblingIndex(source.container, targetContainer, desktop, position.kind);

        placeContainerAsSibling(browser, source.container, targetContainer, desktop, index);
        return;
      }

      const base = target.index;
      const index = position.kind === 'before-tab' ? base : base + 1;
      moveTabIntoContainer(browser, sourceData, targetContainer, index);
      return;
    }

    case 'as-child': {
      const target = findContainerOfTab(desktop, position.targetTabId);
      if (!target) {
        scopeLog.error(`Target tab ${position.targetTabId} not found in desktop ${desktop.id}`);
        return;
      }

      const root = rootContainerOf(target.container);
      const newChild = root.createChildTabContainer(browser.idGenerator.nextTabContainerId);
      browser.indexTabContainer(window, desktop, newChild);

      sourceContainer.takeTab(tab.id);

      if (sourceContainer.tabs.length === 0) {
        pruneEmptyContainer(browser, sourceContainer, desktop);
      }

      newChild.addTab(tab);
      browser.unindexTab(tab.id);
      browser.indexTab(window, desktop, newChild, tab);

      browser.eventsChannel.emit(
        'browser:tab-did-move',
        newChild,
        tab,
        window,
        desktop,
        window,
        desktop,
      );
      return;
    }

    case 'out-of-container': {
      const targetContainer = findContainerById(desktop, position.targetTabContainerId);
      if (!targetContainer) {
        scopeLog.error(
          `Target tab container ${position.targetTabContainerId} not found in desktop ${desktop.id}`,
        );
        return;
      }

      const destination = targetContainer.parent;

      if (!destination) {
        moveTabToPosition(browser, sourceData, { kind: 'desktop' });
        return;
      }

      const index = destination.tabs.findIndex((t) => t.id === tab.id);
      const insertIndex = index === -1 ? destination.tabs.length : index;
      moveTabIntoContainer(browser, sourceData, destination, insertIndex);
      return;
    }

    case 'desktop': {
      const isTopLevel = !sourceContainer.parent;

      if (sourceContainer.tabs.length === 1) {
        if (isTopLevel) {
          desktop.moveTabContainerToIndex(sourceContainer.id, desktop.tabContainers.length - 1);
          browser.eventsChannel.emit('desktop:tabcontainers-order-did-change', window, desktop);
          return;
        }

        sourceContainer.parent?.removeChild(sourceContainer.id);
        sourceContainer.setParent(null);
        desktop.addTabContainer(sourceContainer);
        desktop.moveTabContainerToIndex(sourceContainer.id, desktop.tabContainers.length - 1);
        browser.eventsChannel.emit('desktop:tabcontainers-order-did-change', window, desktop);
        return;
      }

      const newContainer = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
      browser.indexTabContainer(window, desktop, newContainer);

      sourceContainer.takeTab(tab.id);

      if (sourceContainer.tabs.length === 0) {
        pruneEmptyContainer(browser, sourceContainer, desktop);
      }

      newContainer.addTab(tab);
      browser.unindexTab(tab.id);
      browser.indexTab(window, desktop, newContainer, tab);

      browser.eventsChannel.emit(
        'browser:tab-did-move',
        newContainer,
        tab,
        window,
        desktop,
        window,
        desktop,
      );
      return;
    }
  }
}

function rootContainerOf(container: TabContainer): TabContainer {
  let current: TabContainer = container;
  while (current.parent !== null) {
    current = current.parent;
  }
  return current;
}
