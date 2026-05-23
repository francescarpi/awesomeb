import { Rectangle, screen } from 'electron';
import log from 'electron-log';
import { Browser } from '@/core';

const scopeLog = log.scope('WindowHelper');

export function getNextPreviousBounds(
  browser: Browser,
  which: 'next' | 'previous',
): Rectangle | null {
  const displays = screen.getAllDisplays();
  if (displays.length <= 1) {
    scopeLog.info('Single display detected. No need to get display bounds.');
    return null;
  }

  const focusedWindow = browser.activeWindow;
  if (!focusedWindow) {
    scopeLog.warn('No focused window to determine display bounds.');
    return null;
  }

  const currentWindowBounds = focusedWindow.bounds;
  const currentDisplay = screen.getDisplayMatching(currentWindowBounds);
  const currentIndex = displays.findIndex((d) => d.id === currentDisplay.id);

  if (which === 'next') {
    const nextIndex = (currentIndex + 1) % displays.length;
    return displays[nextIndex].workArea;
  }

  const previousIndex = (currentIndex - 1 + displays.length) % displays.length;

  return displays[previousIndex].workArea;
}
