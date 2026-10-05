import type { ITheme, ILayoutData, TDesktopId } from '~/types';
import { LAYOUT_MARGIN, BORDER_WIDTH } from '~/constants';

let completedFlashTimer: ReturnType<typeof setTimeout> | undefined;

export function applyTheme(theme: ITheme) {
  const mainContainer = document.getElementById('main-container') as HTMLDivElement;
  mainContainer.style =
    `background-image: linear-gradient(${theme.degrees}deg,` +
    `${theme.primary}, ${theme.secondary})`;
}

export function updateLayout(data: ILayoutData) {
  const sidebarContainer = document.getElementById('sidebar-container') as HTMLDivElement;
  const urlContainer = document.getElementById('url-container') as HTMLDivElement;
  const tabSelected = document.getElementById('tab-container-selected') as HTMLDivElement;

  sidebarContainer.style.width = `${data.sidebarWidth - LAYOUT_MARGIN}px`;

  if (data.areaMaximized) {
    sidebarContainer.classList.add('hidden');
    urlContainer.classList.add('hidden');
  } else {
    sidebarContainer.classList.remove('hidden');
    urlContainer.classList.remove('hidden');
  }

  if (data.selectedTabBounds && data.selectedTabPartitionColor) {
    tabSelected.classList.remove('hidden');
    tabSelected.style.left = `${data.selectedTabBounds.x - BORDER_WIDTH}px`;
    tabSelected.style.top = `${data.selectedTabBounds.y - BORDER_WIDTH}px`;
    tabSelected.style.width = `${data.selectedTabBounds.width + BORDER_WIDTH * 2}px`;
    tabSelected.style.height = `${data.selectedTabBounds.height + BORDER_WIDTH * 2}px`;
    tabSelected.style.borderColor = data.selectedTabPartitionColor;
  } else {
    tabSelected.classList.add('hidden');
  }

  if (data.sidebarCollapsed) {
    sidebarContainer.classList.add('collapsed');
  } else {
    sidebarContainer.classList.remove('collapsed');
  }
}

export function updateSelectedDesktopClass(desktopId: TDesktopId) {
  const sidebarTabs = document.getElementById('sidebar-tabs') as HTMLDivElement;
  const className = sidebarTabs.className
    .split(' ')
    .filter((c) => !c.startsWith('desktop'))
    .join(' ');
  sidebarTabs.className = `${className} desktop${desktopId}`;
}

export function downloadCompleted() {
  const iconEl = document.getElementById('downloads-icon');
  if (!iconEl) return;
  iconEl.classList.remove('icon-bounce');
  void iconEl.offsetWidth;
  iconEl.classList.add('icon-bounce');

  clearTimeout(completedFlashTimer);
  completedFlashTimer = setTimeout(() => {
    const iconEl = document.getElementById('downloads-icon');
    if (iconEl) {
      iconEl.classList.remove('icon-bounce');
    }
  }, 1600);
}

export function showTabContainer(visible: boolean) {
  const el = document.getElementById('tab-container') as HTMLDivElement;
  if (visible) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

export function setSidebarDragable(value: boolean) {
  const el = document.getElementById('sidebar-container') as HTMLDivElement;
  if (value) {
    el.classList.add('dragable');
  } else {
    el.classList.remove('dragable');
  }
}
