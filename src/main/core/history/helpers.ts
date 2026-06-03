import { type WebContents, type NavigationEntry } from 'electron';

export function sanitizeHistory(
  wc: WebContents,
  maxEntries = 50,
): { index: number; entries: NavigationEntry[] } {
  // Create a deep copy of the navigation entries to avoid mutating the original objects
  let entries = wc.navigationHistory.getAllEntries().map((entry) => ({ ...entry }));

  // Remove 'about:blank' entries
  entries = entries.filter((e) => e.url !== 'about:blank');

  // Remove duplicate consecutive entries
  const filtered: NavigationEntry[] = [];
  for (const e of entries) {
    if (filtered.length === 0) {
      filtered.push(e);
    } else {
      const prev = filtered[filtered.length - 1];
      if (prev.url !== e.url) filtered.push(e);
    }
  }
  entries = filtered;

  // Limit to maxEntries
  let index = wc.navigationHistory.getActiveIndex();
  if (entries.length > maxEntries) {
    const sliceStart = entries.length - maxEntries;
    entries = entries.slice(sliceStart);
    index = Math.max(0, index - sliceStart);
  }

  // Last validation of index
  if (index < 0) index = 0;
  if (index >= entries.length) index = Math.max(0, entries.length - 1);

  return { index, entries };
}
