export type DropTarget =
  | { kind: 'before-tab'; tabId: number }
  | { kind: 'after-tab'; tabId: number }
  | { kind: 'as-child'; tabId: number }
  | { kind: 'out-of-container'; tabContainerId: number }
  | { kind: 'desktop' };

const LINE_BEFORE_CLASS = 'drag-drop-line-before';
const LINE_AFTER_CLASS = 'drag-drop-line-after';
const HIGHLIGHT_CLASS = 'drag-drop-highlight';

let draggedTabId: number | null = null;
let currentTarget: DropTarget | null = null;
let indicatorEl: HTMLElement | null = null;
let indicatorClasses: string[] = [];

export function isDraggingTab(): boolean {
  return draggedTabId !== null;
}

export function draggedTab(): number | null {
  return draggedTabId;
}

function tabIdFromEvent(e: Event): number | null {
  const row = (e.target as HTMLElement | null)?.closest('[data-tab-id]') as HTMLElement | null;
  const raw = row?.dataset.tabId;
  return raw === undefined ? null : Number(raw);
}

function computeDropTarget(e: Event): DropTarget {
  const target = e.target as HTMLElement | null;

  const tabRow = target?.closest('[data-tab-id]') as HTMLElement | null;
  if (tabRow) {
    const tabId = Number(tabRow.dataset.tabId);

    if (tabRow.dataset.openTabsAsChild === 'true' && tabId !== draggedTabId) {
      return { kind: 'as-child', tabId };
    }

    const rect = tabRow.getBoundingClientRect();
    const isTopHalf = (e as DragEvent).clientY < rect.top + rect.height / 2;
    return isTopHalf ? { kind: 'before-tab', tabId } : { kind: 'after-tab', tabId };
  }

  const containerRow = target?.closest('[data-tab-container-id]') as HTMLElement | null;
  if (containerRow) {
    return {
      kind: 'out-of-container',
      tabContainerId: Number(containerRow.dataset.tabContainerId),
    };
  }

  return { kind: 'desktop' };
}

function clearIndicator() {
  if (indicatorEl) {
    indicatorEl.classList.remove(...indicatorClasses);
  }
  indicatorEl = null;
  indicatorClasses = [];
}

function paintIndicator(target: DropTarget) {
  clearIndicator();

  switch (target.kind) {
    case 'before-tab':
    case 'after-tab': {
      const row = document.querySelector<HTMLElement>(
        `#sidebar-tabs [data-tab-id="${target.tabId}"]`,
      );
      if (!row) return;
      indicatorEl = row;
      indicatorClasses = [target.kind === 'before-tab' ? LINE_BEFORE_CLASS : LINE_AFTER_CLASS];
      break;
    }
    case 'as-child': {
      const row = document.querySelector<HTMLElement>(
        `#sidebar-tabs [data-tab-id="${target.tabId}"]`,
      );
      if (!row) return;
      indicatorEl = row;
      indicatorClasses = [HIGHLIGHT_CLASS];
      break;
    }
    case 'out-of-container': {
      const row = document.querySelector<HTMLElement>(
        `#sidebar-tabs [data-tab-container-id="${target.tabContainerId}"]`,
      );
      if (!row) return;
      indicatorEl = row;
      indicatorClasses = [HIGHLIGHT_CLASS];
      break;
    }
    case 'desktop':
      return;
  }

  indicatorEl.classList.add(...indicatorClasses);
}

function isSameTarget(a: DropTarget | null, b: DropTarget | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.kind !== b.kind) return false;
  if (a.kind === 'before-tab' && b.kind === 'before-tab') return a.tabId === b.tabId;
  if (a.kind === 'after-tab' && b.kind === 'after-tab') return a.tabId === b.tabId;
  if (a.kind === 'as-child' && b.kind === 'as-child') return a.tabId === b.tabId;
  if (a.kind === 'out-of-container' && b.kind === 'out-of-container') {
    return a.tabContainerId === b.tabContainerId;
  }
  return true;
}

export function tabDragStart(e: Event) {
  const dragEvent = e as DragEvent;
  const tabId = tabIdFromEvent(dragEvent);
  if (tabId === null) return;

  draggedTabId = tabId;
  currentTarget = null;

  if (dragEvent.dataTransfer) {
    dragEvent.dataTransfer.effectAllowed = 'move';
    dragEvent.dataTransfer.setData('text/plain', String(tabId));
  }
}

export function tabDragOver(e: Event) {
  if (draggedTabId === null) return;

  const dragEvent = e as DragEvent;
  dragEvent.preventDefault();
  if (dragEvent.dataTransfer) {
    dragEvent.dataTransfer.dropEffect = 'move';
  }

  const target = computeDropTarget(dragEvent);
  if (isSameTarget(target, currentTarget)) return;

  currentTarget = target;
  paintIndicator(target);
}

export function tabDragLeave(e: Event) {
  if (draggedTabId === null) return;

  const dragEvent = e as DragEvent;
  const related = dragEvent.relatedTarget as Node | null;
  if (related && indicatorEl?.contains(related)) return;

  currentTarget = null;
  clearIndicator();
}

export function tabDrop(e: Event) {
  if (draggedTabId === null) return;

  const dragEvent = e as DragEvent;
  dragEvent.preventDefault();
  dragEvent.stopPropagation();

  const target = currentTarget ?? computeDropTarget(dragEvent);

  const isSelf =
    (target.kind === 'before-tab' || target.kind === 'after-tab') && target.tabId === draggedTabId;

  if (!isSelf) {
    console.log('[sidebar.drag] move tab', { tabId: draggedTabId, to: target });
  }

  resetDragState();
}

export function tabDragEnd() {
  resetDragState();
}

function resetDragState() {
  draggedTabId = null;
  currentTarget = null;
  clearIndicator();
}
