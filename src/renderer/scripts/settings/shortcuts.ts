import { h, Renderer, c } from '#/scripts';
import type { IConfig, IShortcut, TShortcutId, TShortcutMapId } from '~/types';
import { acceleratorToDisplay, keyEventToAccelerator } from '~/utils/shortcuts';
import { box } from './common';

// Capture state — which shortcut is being edited and its keydown handler
let capturingId: TShortcutId | null = null;
let captureHandler: ((event: KeyboardEvent) => void) | null = null;
let mapId: TShortcutMapId = 'generic-iso';

/** Removes the keydown listener and resets capture state */
function clearCapture() {
  if (captureHandler) {
    document.removeEventListener('keydown', captureHandler, true);
    captureHandler = null;
  }
  capturingId = null;
}

/**
 * Puts a shortcut into capture mode. On next keydown, the combination is
 * recorded, the shortcut updated locally, and persisted via IPC.
 *
 * When a shortcut is captured, the list re-renders to show the new key
 * immediately. The override is saved to config so it survives reloads.
 */
function startCapture(
  shortcutId: TShortcutId,
  renderer: Renderer,
  shortcuts: Record<TShortcutId, IShortcut>,
) {
  clearCapture();
  capturingId = shortcutId;
  updateShortcutsList(renderer, shortcuts);

  captureHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      clearCapture();
      updateShortcutsList(renderer, shortcuts);
      return;
    }

    const accelerator = keyEventToAccelerator(event);
    if (!accelerator) return;

    shortcuts[shortcutId].key = accelerator;
    clearCapture();
    updateShortcutsList(renderer, shortcuts);
    abShortcuts.override(mapId, shortcutId, accelerator);
  };

  document.addEventListener('keydown', captureHandler, true);
}

/** Loads shortcuts from the map, applies saved overrides, and builds the page */
export async function renderShortcutsPage(config: IConfig): Promise<{
  renderer: Renderer;
  callback: () => void;
}> {
  const maps = await abShortcuts.maps();
  mapId = config.shortcutMap;
  const shortcuts = maps[config.shortcutMap].shortcuts;

  // Apply any previously saved overrides on top of the map defaults
  for (const [id, key] of Object.entries(config.shortcutsOverrides ?? {})) {
    if (shortcuts[id]) shortcuts[id].key = key;
  }

  const shortcutsRenderer = new Renderer(h('ul', {}, h('li', {}, 'Loading...')));

  const renderer = new Renderer(
    h(
      'div',
      {},
      box(
        'Default Map',
        'Define a default keyboard layout that suits you best. You can then customize specific keys to your preferences.',
        h(
          'select',
          { class: c('select', 'w-40', 'text-black'), onchange: () => {} },
          ...Object.entries(maps).map(([id, map]) =>
            h('option', { value: id, selected: config.shortcutMap === id }, map.name),
          ),
        ),
      ),
      box(
        'Shortcuts',
        'Click on a shortcut key to change its combination. Press Escape to cancel.',
        h('div', { id: 'shortcuts-list', class: c('text-sm') }),
      ),
    ),
  );

  const callback = () => {
    shortcutsRenderer.render('shortcuts-list');
    updateShortcutsList(shortcutsRenderer, shortcuts);
  };

  return { renderer, callback };
}

/** Groups shortcuts by their group field, sorts within each group, and renders */
function updateShortcutsList(renderer: Renderer, shortcuts: Record<TShortcutId, IShortcut>) {
  // Group entries by EShortcutGroup, keeping the id so we can target updates
  const entries = Object.entries(shortcuts) as [TShortcutId, IShortcut][];
  const grouped = entries.reduce(
    (acc, [id, sc]) => {
      if (!acc[sc.group]) acc[sc.group] = [];
      acc[sc.group].push([id, sc]);
      return acc;
    },
    {} as Record<string, [TShortcutId, IShortcut][]>,
  );

  const sortedGroups = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  sortedGroups.forEach((g) => {
    grouped[g].sort((a, b) => a[1].label.localeCompare(b[1].label));
  });

  renderer.update(
    h(
      'div',
      {},
      ...sortedGroups.flatMap((groupKey) => {
        const items = grouped[groupKey];
        return [
          h('div', { class: c('font-bold', 'mt-4', 'mb-2') }, groupKey),
          ...items.map(([id, sc]) => {
            const isCapturing = capturingId === id;
            return h(
              'div',
              { class: c('flex', 'items-center', 'justify-start', 'mb-2', 'ml-4') },
              h('span', { class: c('w-55') }, sc.label),
              // Show a "listening" badge while capturing, otherwise a clickable button
              isCapturing
                ? h('span', { class: c('badge', 'badge-warning', 'w-36') }, 'Press a key...')
                : h(
                    'button',
                    {
                      class: c('btn', 'btn-xs', 'btn-ghost', 'border', 'w-36'),
                      onclick: () => startCapture(id, renderer, shortcuts),
                    },
                    acceleratorToDisplay(sc.key),
                  ),
            );
          }),
        ];
      }),
    ),
  );
}
