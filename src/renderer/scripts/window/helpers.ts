import type { ITheme } from '~/types';

export function applyTheme(theme: ITheme) {
  const mainContainer = document.getElementById('main-container')!;
  mainContainer.style =
    `background-image: linear-gradient(${theme.degrees}deg,` +
    `${theme.primary}, ${theme.secondary})`;
}
