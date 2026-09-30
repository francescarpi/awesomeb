import type { ITheme, ILayoutData } from '~/types';

export function applyTheme(theme: ITheme) {
  const mainContainer = document.getElementById('main-container') as HTMLDivElement;
  mainContainer.style =
    `background-image: linear-gradient(${theme.degrees}deg,` +
    `${theme.primary}, ${theme.secondary})`;
}

export function updateLayout(data: ILayoutData) {
  const sidebarContainer = document.getElementById('sidebar-container') as HTMLDivElement;
  const urlContainer = document.getElementById('url-container') as HTMLDivElement;

  sidebarContainer.style.width = `${data.sidebarWidth}px`;

  if (data.areaMaximized) {
    sidebarContainer.classList.add('hidden');
    urlContainer.classList.add('hidden');
  } else {
    sidebarContainer.classList.remove('hidden');
    urlContainer.classList.remove('hidden');
  }
}
