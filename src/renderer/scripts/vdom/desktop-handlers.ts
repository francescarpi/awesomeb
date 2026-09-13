import { getSearchParams } from '../url';

/**
 * Resolve a desktop id from a DOM event by walking up to the nearest
 * `[data-desktop-id]` ancestor. Returns `null` when the event did not
 * originate inside a desktop row.
 */
export function desktopIdFromEvent(e: Event): number | null {
  const row = (e.currentTarget as HTMLElement | null)?.closest(
    '[data-desktop-id]',
  ) as HTMLElement | null;
  const raw = row?.dataset.desktopId;
  return raw === undefined ? null : Number(raw);
}

/**
 * Stable handler for desktop click events. Reads the desktop id from the
 * closest `[data-desktop-id]` ancestor at event time instead of capturing it
 * in a closure, so the VDOM sees the SAME function reference on every
 * rebuild — zero listener churn.
 */
export function selectDesktopFromEvent(e: Event) {
  const desktopId = desktopIdFromEvent(e);
  if (desktopId !== null) {
    abDesktops.select(getSearchParams().winId, desktopId);
  }
}

/**
 * Stable handler for desktop right-click (context menu) events. Uses the same
 * data-attribute delegation pattern as `selectDesktopFromEvent`.
 */
export function desktopMenuFromEvent(e: Event) {
  const desktopId = desktopIdFromEvent(e);
  if (desktopId !== null) {
    abMenu.contextMenu(getSearchParams().winId, 'desktop', { desktopId });
  }
}
