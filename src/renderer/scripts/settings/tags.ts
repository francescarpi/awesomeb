import { h, Renderer, type VNode, btnIcon } from '#/scripts';
import type { IConfig } from '~/types';
import { box, inputColorPicker } from './common';
import Delete from '#/icons/delete.svg?raw';
import ColorPicker from '@thednp/color-picker';

const { init, selector } = ColorPicker;

type Translations = Record<string, string>;

const KEYS = [
  'pages:settings.tags.title',
  'pages:settings.tags.desc',
  'pages:settings.tags.name',
  'pages:settings.tags.color',
  'pages:settings.tags.add',
  'pages:settings.tags.saveChanges',
  'pages:settings.tags.newTag',
];

//-----------------------------------------------------------------------------
export async function renderTagsPage(
  config: IConfig,
): Promise<{ renderer: Renderer; callback: () => void }> {
  const t = await abI18n.t(
    { winId: -1 },
    KEYS.map((key) => ({ key })),
  );
  const renderer = new Renderer(
    buildTagsBody(
      config.tags,
      {
        onSave: () => saveChanges(renderer, config, t),
        onDelete: (id) => deleteTag(id, renderer, config, t),
        onAdd: () => addTag(renderer, config, t),
      },
      t,
    ),
  );

  const callback = () => document.querySelectorAll(selector).forEach(init);

  return { renderer, callback };
}

//-----------------------------------------------------------------------------
function buildTagsBody(
  tags: { id: string; name: string; color: string }[],
  callbacks: {
    onSave: () => Promise<void>;
    onDelete: (id: string) => void;
    onAdd: () => void;
  },
  t: Translations,
): VNode {
  return h(
    'div',
    { class: 'flex flex-col gap-2' },
    box(
      t['pages:settings.tags.title'],
      t['pages:settings.tags.desc'],
      h(
        'div',
        { class: 'flex flex-col gap-2' },
        h(
          'table',
          { class: 'table', id: 'tags-table' },
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              h('th', { class: 'text-left px-1' }, t['pages:settings.tags.name']),
              h('th', { class: 'text-left px-1 w-25' }, t['pages:settings.tags.color']),
              h('th', { class: 'w-13' }, ''),
            ),
          ),
          h(
            'tbody',
            {},
            ...tags.map((tag) =>
              h(
                'tr',
                { 'data-tag-id': tag.id },
                h(
                  'td',
                  { class: 'p-0.5' },
                  h(
                    'input',
                    {
                      value: tag.name,
                      class: 'input input-sm w-full',
                    },
                    '',
                  ),
                ),
                h('td', { class: 'px-1' }, inputColorPicker(tag.color)),
                h(
                  'td',
                  {},
                  btnIcon(Delete, {
                    onClick: callbacks.onDelete.bind(null, tag.id),
                    doubleConfirmation: true,
                  }),
                ),
              ),
            ),
          ),
        ),
        h(
          'div',
          { class: 'flex justify-between' },
          h(
            'button',
            { class: 'btn btn-sm btn-outline', onclick: callbacks.onAdd },
            t['pages:settings.tags.add'],
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'flex justify-between' },
      h('div', {}),
      h(
        'button',
        { class: 'btn btn-sm btn-primary', onclick: callbacks.onSave },
        t['pages:settings.tags.saveChanges'],
      ),
    ),
  );
}

//-----------------------------------------------------------------------------
async function saveChanges(renderer: Renderer, config: IConfig, t: Translations) {
  const tags = getTableTags();
  const result = await abConfig.saveTags(tags);

  if (!result) {
    return;
  }

  config.tags = result.tags;

  renderer.update(
    buildTagsBody(
      result.tags,
      {
        onSave: () => saveChanges(renderer, config, t),
        onDelete: (id) => deleteTag(id, renderer, config, t),
        onAdd: () => addTag(renderer, config, t),
      },
      t,
    ),
    {
      onUpdated: () => {
        document.querySelectorAll(selector).forEach(init);
      },
    },
  );
}

//-----------------------------------------------------------------------------
async function deleteTag(
  id: string,
  renderer: Renderer,
  config: IConfig,
  t: Translations,
): Promise<void> {
  const result = await abConfig.deleteTag(id);

  config.tags = result.tags;

  renderer.update(
    buildTagsBody(
      result.tags,
      {
        onSave: () => saveChanges(renderer, config, t),
        onDelete: (tagId) => deleteTag(tagId, renderer, config, t),
        onAdd: () => addTag(renderer, config, t),
      },
      t,
    ),
    {
      onUpdated: () => {
        document.querySelectorAll(selector).forEach(init);
      },
    },
  );
}

//-----------------------------------------------------------------------------
function getTableTags(): { name: string; color: string }[] {
  const table = document.getElementById('tags-table') as HTMLTableElement;
  const rows = Array.from(table.tBodies[0].rows);
  const tags: { name: string; color: string }[] = [];

  for (const row of rows) {
    const name = (row.cells[0].firstChild as HTMLInputElement).value.trim();

    if (!name) {
      continue;
    }

    const color =
      (row.querySelector('input[data-function="color-picker"]') as HTMLInputElement | undefined)
        ?.value || '#ffffff';

    tags.push({ name, color });
  }

  return tags;
}

//-----------------------------------------------------------------------------
function addTag(renderer: Renderer, config: IConfig, t: Translations) {
  const newSeed = t['pages:settings.tags.newTag'];
  const tags = config.tags;

  if (tags.some((tag) => tag.name === newSeed)) {
    return;
  }

  const newTags = [
    ...tags,
    { id: `new-${newSeed}`, name: newSeed, color: '#ffffff' },
  ];

  renderer.update(
    buildTagsBody(
      newTags,
      {
        onSave: () => saveChanges(renderer, config, t),
        onDelete: (id) => deleteTag(id, renderer, config, t),
        onAdd: () => addTag(renderer, config, t),
      },
      t,
    ),
    {
      onUpdated: () => {
        const lastRow = (document.getElementById('tags-table') as HTMLTableElement).tBodies[0]
          .lastElementChild as HTMLTableRowElement;

        const input = lastRow.querySelector('[data-function="color-picker"]') as HTMLInputElement;

        init(input);
      },
    },
  );
}
