import { acceleratorToDisplay, isMacPlatform } from '~/utils/shortcuts';
import { Renderer, h } from '#/scripts';
import type { TWindowId } from '~/types';

export async function renderShortcuts(winId: TWindowId, renderer: Renderer) {
  try {
    const map = await abShortcuts.active(winId);

    const platform = isMacPlatform() ? 'mac' : 'win';
    const shortcuts = [map.shortcuts.newTab, map.shortcuts.performCommand].filter((shortcut) =>
      shortcut?.key?.trim(),
    );

    const shortcutsStringList = shortcuts.map(
      (shortcut) => `${acceleratorToDisplay(shortcut.key, platform)} ${shortcut.label}`,
    );

    renderer.update(shortcutsStringList.map((s) => h('div', { key: s }, s)));
  } catch (error) {
    console.error('Failed to load active shortcuts', error);
  }
}
