import { h, Renderer, c } from '#/scripts';
import type { IConfig, IShortcut, TShortcutId, EShortcutGroup } from '~/types';
import { box } from './common';

export async function renderShortcutsPage(config: IConfig): Promise<{
  renderer: Renderer;
  callback: () => void;
}> {
  const maps = await abShortcuts.maps();
  const shortcuts = maps[config.shortcutMap].shortcuts;
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
        'View and customize your keyboard shortcuts. Click on a shortcut to change its key combination.',
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

function updateShortcutsList(renderer: Renderer, shortcuts: Record<TShortcutId, IShortcut>) {
  const grouped = Object.values(shortcuts).reduce(
    (acc, sc) => {
      if (!acc[sc.group]) acc[sc.group] = [];
      acc[sc.group].push(sc);
      return acc;
    },
    {} as Record<EShortcutGroup, IShortcut[]>,
  );

  const sortedGroups = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  sortedGroups.forEach((group) => {
    grouped[group as EShortcutGroup].sort((a, b) => a.label.localeCompare(b.label));
  });

  renderer.update(
    h(
      'div',
      {},
      ...sortedGroups.flatMap((groupKey) => {
        const group = groupKey as EShortcutGroup;
        const items = grouped[group];
        return [
          h('div', { class: c('font-bold', 'mt-4', 'mb-2') }, group),
          ...items.map((sc) =>
            h(
              'div',
              { class: c('flex', 'items-center', 'justify-start', 'mb-2', 'ml-4') },
              h('span', { class: c('w-55') }, sc.label),
              h('input', {
                class: c('input', 'input-xs', 'w-36', 'text-black'),
                value: sc.key,
                readonly: true,
              }),
            ),
          ),
        ];
      }),
    ),
  );
}
