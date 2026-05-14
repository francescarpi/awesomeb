import { h, Renderer, type VNode, c, btnIcon } from '#/scripts';
import type { IConfig, IConfigPartition } from '~/types';
import { box, inputColorPicker } from './common';
import Delete from '#/icons/delete.svg?raw';
import ColorPicker from '@thednp/color-picker';

const { init, selector } = ColorPicker;

//-----------------------------------------------------------------------------
export async function renderProfilesPage(
  config: IConfig,
): Promise<{ renderer: Renderer; callback: () => void }> {
  const renderer = new Renderer(
    buildGeneralBody(config.partitions, {
      onSave: () => saveChanges(config),
      onDelete: (name) => deletePartition(name, renderer, config),
      onAdd: () => addPartition(renderer, config),
    }),
  );

  const callback = () => document.querySelectorAll(selector).forEach(init);

  return { renderer, callback };
}

//-----------------------------------------------------------------------------
function buildGeneralBody(
  partitions: IConfigPartition[],
  callbacks: { onSave: () => Promise<void>; onDelete: (name: string) => void; onAdd: () => void },
): VNode {
  return h(
    'div',
    { class: c('flex', 'flex-col', 'gap-2', 'text-sm') },
    box(
      'Profiles',
      'Manage isolated CHrome profiles (partitions) with separate cookies, sessions, and storage for each workspace or user.',
      h(
        'div',
        { class: c('flex', 'flex-col', 'gap-2') },
        h(
          'table',
          { class: c('w-full', 'border-collapse'), id: 'partitions-table' },
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              h('th', { class: c('text-left', 'px-1') }, 'Name'),
              h('th', { class: c('text-left', 'px-1', 'w-14') }, 'Color'),
              h('th', { class: c('w-6') }, ''),
            ),
          ),
          h(
            'tbody',
            {},
            ...partitions.map((partition) =>
              h(
                'tr',
                {},
                h(
                  'td',
                  { class: c('p-0.5') },
                  h(
                    'input',
                    {
                      value: partition.name,
                      class: c('outline-none', 'bg-white/10', 'px-2', 'py-1', 'w-full'),
                      type: 'url',
                    },
                    '',
                  ),
                ),
                h('td', { class: c('px-1') }, inputColorPicker(partition.color)),
                h(
                  'td',
                  {},
                  btnIcon(Delete, { onClick: callbacks.onDelete.bind(null, partition.name) }),
                ),
              ),
            ),
          ),
        ),
        h(
          'div',
          { class: c('flex', 'justify-between') },
          h(
            'button',
            { class: c('btn', 'btn-xs', 'btn-outline'), onclick: callbacks.onAdd },
            'Add',
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: c('flex', 'justify-between') },
      h(
        'p',
        {},
        'To apply the new changes to the profiles, it is necessary to restart the browser.',
      ),
      h('button', { class: c('btn', 'btn-primary'), onclick: callbacks.onSave }, 'Save changes'),
    ),
  );
}

//-----------------------------------------------------------------------------
function buildGeneralCallbacks(renderer: Renderer, config: IConfig) {
  return {
    onSave: () => saveChanges(config),
    onDelete: (name: string) => deletePartition(name, renderer, config),
    onAdd: () => addPartition(renderer, config),
  };
}

//-----------------------------------------------------------------------------
async function saveChanges(config: IConfig) {
  const partitions = getTablePartitions();
  const newConfig = { ...config, partitions };
  await abConfig.save(newConfig);
}

//-----------------------------------------------------------------------------
function deletePartition(name: string, renderer: Renderer, config: IConfig) {
  const partitions = getTablePartitions().filter((p) => p.name !== name);
  renderer.update(buildGeneralBody(partitions, buildGeneralCallbacks(renderer, config)));
}

//-----------------------------------------------------------------------------
function getTablePartitions(): IConfigPartition[] {
  const table = document.getElementById('partitions-table') as HTMLTableElement;
  const rows = Array.from(table.tBodies[0].rows);
  const partitions: IConfigPartition[] = [];

  for (const row of rows) {
    const name = (row.cells[0].firstChild as HTMLInputElement).value.trim();

    if (!name) {
      continue; // Skip empty names
    }

    const color =
      (row.querySelector('input[data-function="color-picker"]') as HTMLInputElement | undefined)
        ?.value || '#ffffff';

    partitions.push({
      name,
      color,
    });
  }

  return partitions;
}

//-----------------------------------------------------------------------------
function addPartition(renderer: Renderer, config: IConfig) {
  const partitions = getTablePartitions();
  if (partitions.some((p) => p.name === 'New')) {
    return;
  }

  const newPartitions: IConfigPartition[] = [...partitions, { name: 'New', color: '#ffffff' }];

  renderer.update(buildGeneralBody(newPartitions, buildGeneralCallbacks(renderer, config)), {
    onUpdated: () => {
      const lastRow = (document.getElementById('partitions-table') as HTMLTableElement).tBodies[0]
        .lastElementChild as HTMLTableRowElement;

      const input = lastRow.querySelector('[data-function="color-picker"]') as HTMLInputElement;

      init(input);
    },
  });
}
