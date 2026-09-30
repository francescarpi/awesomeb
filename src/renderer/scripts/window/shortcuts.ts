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

    const result = shortcuts.map(
      (shortcut) => `${acceleratorToDisplay(shortcut.key, platform)} ${shortcut.label}`,
    );

    renderer.update(h('div', {}, ...result.map((s) => h('div', {}, s))));
  } catch (error) {
    console.error('Failed to load active shortcuts', error);
  }
}
