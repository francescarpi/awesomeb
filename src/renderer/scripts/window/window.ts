import type { IWindowState, IWindowBounds } from './types';
import { LAYOUT_MARGIN } from '~/constants';
import { URLBAR_HEIGHT } from '~/constants';

const toString = (obj: Record<string, number>) =>
  Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}px`)
    .join('; ');

export function calculateBounds(state: IWindowState): IWindowBounds {
  const sidebar = {
    left: LAYOUT_MARGIN,
    top: LAYOUT_MARGIN,
    bottom: LAYOUT_MARGIN,
    width: state.sidebarWidth - LAYOUT_MARGIN * 2,
  };

  const urlbar = {
    left: sidebar.left + sidebar.width + LAYOUT_MARGIN,
    top: LAYOUT_MARGIN,
    right: LAYOUT_MARGIN,
  };

  const main = {
    left: state.areaMaximized ? LAYOUT_MARGIN : state.sidebarWidth,
    top: state.areaMaximized ? LAYOUT_MARGIN : urlbar.top + URLBAR_HEIGHT + LAYOUT_MARGIN,
  };

  return {
    sidebar: toString(sidebar),
    urlbar: toString(urlbar),
    main: toString(main),
  };
}
