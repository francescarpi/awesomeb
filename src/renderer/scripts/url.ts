import type { TWindowId, TTabId } from '~/types';

export function getSearchParams(): {
  searchParams: URLSearchParams;
  winId: TWindowId;
  tabId: TTabId;
  theme: string | null;
} {
  const searchParams = new URLSearchParams(window.location.search);
  const winId = searchParams.get('winId');
  const tabId = searchParams.get('tabId');
  return {
    searchParams,
    winId: winId ? (parseInt(winId, 10) as TWindowId) : -1,
    tabId: tabId ? (parseInt(tabId, 10) as TTabId) : -1,
    theme: searchParams.get('theme'),
  };
}
