import { TWindowId } from '~/types';

export function getSearchParams(): { searchParams: URLSearchParams; winId: TWindowId } {
  const searchParams = new URLSearchParams(window.location.search);
  const winId = searchParams.get('winId');
  return {
    searchParams,
    winId: winId ? (parseInt(winId, 10) as TWindowId) : -1,
  };
}
