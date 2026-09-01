import { h, Renderer, c } from '#/scripts';
import type { IConfig, IShortcut, TShortcutId, TShortcutMapId } from '~/types';
import { acceleratorToDisplay, keyEventToAccelerator } from '~/utils/shortcuts';
import { box } from './common';
import { DEFAULT_SHORTCUTS_MAP } from '~/constants';

type Translations = Record<string, string>;

const KEYS = [
  'pages:settings.shortcuts.map.title',
  'pages:settings.shortcuts.map.desc',
  'pages:settings.shortcuts.list.title',
  'pages:settings.shortcuts.list.desc',
  'pages:settings.shortcuts.loading',
  'pages:settings.shortcuts.pressKey',
];

// Capture state — which shortcut is being edited and its keydown handler
let capturingId: TShortcutId | null = null;
let captureHandler: ((event: KeyboardEvent) => void) | null = null;
let mapId: TShortcutMapId = DEFAULT_SHORTCUTS_MAP;

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
  t: Translations,
) {
  clearCapture();
  capturingId = shortcutId;
  updateShortcutsList(renderer, shortcuts, t);

  captureHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      clearCapture();
      updateShortcutsList(renderer, shortcuts, t);
      return;
    }

    const accelerator = keyEventToAccelerator(event);
    if (!accelerator) return;

    shortcuts[shortcutId].key = accelerator;
    clearCapture();
    updateShortcutsList(renderer, shortcuts, t);
    abShortcuts.override(mapId, shortcutId, accelerator);
  };

  document.addEventListener('keydown', captureHandler, true);
}

export async function getShortcuts(config: IConfig) {
  const maps = await abShortcuts.maps();
  const shortcuts = { ...maps[config.shortcutMap].shortcuts };

  // Apply any previously saved overrides on top of the map defaults
  for (const [id, key] of Object.entries(config.shortcutsOverrides ?? {})) {
    if (shortcuts[id]) shortcuts[id].key = key;
  }

  return { shortcuts, maps };
}

/** Loads shortcuts from the map, applies saved overrides, and builds the page */
export async function renderShortcutsPage(config: IConfig): Promise<{
  renderer: Renderer;
  callback: () => void;
}> {
  const t = await abI18n.t(
    { winId: -1 },
    KEYS.map((key) => ({ key })),
  );

  const { shortcuts, maps } = await getShortcuts(config);
  mapId = config.shortcutMap;

  const shortcutsRenderer = new Renderer(
    h('ul', {}, h('li', {}, t['pages:settings.shortcuts.loading'])),
  );

  const renderer = new Renderer(
    h(
      'div',
      {},
      box(
        t['pages:settings.shortcuts.map.title'],
        t['pages:settings.shortcuts.map.desc'],
        h(
          'select',
          {
            class: c('select', 'select-sm', 'w-40'),
            onchange: async (e) => {
              const newConfig = { ...config, shortcutMap: (e.target as HTMLSelectElement).value };
              const cfg = await abConfig.save(newConfig);
              const { shortcuts } = await getShortcuts(cfg);
              updateShortcutsList(shortcutsRenderer, shortcuts, t);
            },
          },
          ...Object.entries(maps).map(([id, map]) =>
            h('option', { value: id, selected: config.shortcutMap === id }, map.name),
          ),
        ),
      ),
      box(
        t['pages:settings.shortcuts.list.title'],
        t['pages:settings.shortcuts.list.desc'],
        h('div', { id: 'shortcuts-list', class: c('text-sm') }),
      ),
    ),
  );

  const callback = () => {
    shortcutsRenderer.render('shortcuts-list');
    updateShortcutsList(shortcutsRenderer, shortcuts, t);
  };

  return { renderer, callback };
}

/** Groups shortcuts by their group field, sorts within each group, and renders */
function updateShortcutsList(
  renderer: Renderer,
  shortcuts: Record<TShortcutId, IShortcut>,
  t: Translations,
) {
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
      { class: c('columns-3') },
      ...sortedGroups.flatMap((groupKey) =>
        h(
          'div',
          { class: c('mb-2', 'bg-base-content/5', 'p-2', 'rounded') },
          h('span', { class: c('font-bold', 'text-base-content') }, groupKey),
          h(
            'div',
            {},
            ...grouped[groupKey].map(([id, sc]) => {
              const isCapturing = capturingId === id;
              return h(
                'div',
                { class: c('flex', 'items-center', 'justify-start', 'mb-2', 'ml-4') },
                h('span', { class: c('w-55') }, sc.label),
                // Show a "listening" badge while capturing, otherwise a clickable button
                isCapturing
                  ? h(
                      'span',
                      { class: c('badge', 'badge-warning', 'w-36', 'py-3.5') },
                      t['pages:settings.shortcuts.pressKey'],
                    )
                  : h(
                      'button',
                      {
                        class: c('btn', 'btn-sm', 'btn-ghost', 'border', 'w-36'),
                        onclick: () => startCapture(id, renderer, shortcuts, t),
                      },
                      acceleratorToDisplay(sc.key),
                    ),
              );
            }),
          ),
        ),
      ),
    ),
  );
}
