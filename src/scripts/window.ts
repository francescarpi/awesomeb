export function getWinId(): number {
  const winId = new URLSearchParams(window.location.search).get('winId');
  return winId ? parseInt(winId, 10) : -1;
}
