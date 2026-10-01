import type { ITheme, ILayoutData, TDesktopId } from '~/types';
import { LAYOUT_MARGIN, BORDER_WIDTH } from '~/constants';

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
