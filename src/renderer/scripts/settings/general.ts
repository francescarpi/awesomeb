import { h, c, Renderer, type VNode, btnIcon } from '#/scripts';
import type { IConfig, IConfigSearchEngine } from '~/types';
import { box } from './common';
import slugify from 'slugify';
import Delete from '#/icons/delete.svg?raw';

export function renderGeneralPage(config: IConfig): Renderer {
  const renderer = new Renderer(
    h(
      'div',
      { class: c('flex', 'flex-col', 'gap-2') },
      renderSearchEngines(
        config.searchEngines,
        () => updateSearchEngines(config),
        () => addSearchEngine(renderer, config),
        (code) => deleteSearchEngine(code, renderer, config),
      ),
    ),
  );
  return renderer;
}

function renderSearchEngines(
  searchEngines: IConfigSearchEngine[],
  handleSave: () => Promise<void>,
  handleAdd: () => void,
  handleDelete: (code: string) => void,
): VNode {
  const engines = h(
    'table',
    { class: c('w-full', 'border-collapse'), id: 'search-engines-table' },
    h(
      'thead',
      {},
      h(
        'tr',
        {},
        h('th', { class: c('text-left', 'px-1') }, 'Name'),
        h('th', { class: c('text-left', 'px-1') }, 'URL'),
        h('th', { class: c('w-6') }, ''),
      ),
    ),
    h(
      'tbody',
      {},
      ...searchEngines.map((engine, idx) =>
        h(
          'tr',
          {
            'data-code': engine.code,
          },
          h(
            'td',
            { class: c('p-0.5') },
            h(
              'input',
              {
                value: engine.label,
                class: c('outline-none', 'bg-white/10', 'px-2', 'py-1', 'w-full'),
              },
              '',
            ),
          ),
          h(
            'td',
            { class: c('p-0.5') },
            h(
              'input',
              {
                value: engine.url,
                class: c('outline-none', 'bg-white/10', 'px-2', 'py-1', 'w-full'),
                type: 'url',
              },
              '',
            ),
          ),
          h(
            'td',
            { class: c(idx === 0 && 'hidden') },
            btnIcon(Delete, { onClick: handleDelete.bind(null, engine.code) }),
          ),
        ),
      ),
    ),
  );

  return box(
    'Search Engines',
    'Configuration for search engines',
    h(
      'div',
      { class: c('text-sm', 'flex', 'flex-col', 'gap-2') },
      engines,
      h(
        'div',
        { class: c('flex', 'justify-between') },
        h('button', { class: c('btn', 'btn-xs', 'btn-outline'), onclick: handleAdd }, 'Add'),
        h(
          'button',
          {
            class: c('btn', 'btn-xs', 'btn-primary'),
            onclick: handleSave,
          },
          'Save Changes',
        ),
      ),
    ),
  );
}

async function updateSearchEngines(config: IConfig) {
  const table = document.getElementById('search-engines-table') as HTMLTableElement;
  const searchEnginesRows = Array.from(table.tBodies[0].rows);

  const searchEngines: IConfigSearchEngine[] = [];
  for (const row of searchEnginesRows) {
    let code = row.dataset.code;

    const label = (row.cells[0].firstChild as HTMLInputElement).value;

    if (code === 'new') {
      code = slugify(label, { lower: true, strict: true });
    }

    const url = (row.cells[1].firstChild as HTMLInputElement).value;

    if (code && label && url && label.trim() && url.trim()) {
      searchEngines.push({ code, label, url });
    }
  }

  const newConfig = { ...config, searchEngines };
  await abConfig.save(newConfig);
}

function addSearchEngine(renderer: Renderer, config: IConfig) {
  const engines: IConfigSearchEngine[] = [
    ...config.searchEngines,
    { code: 'new', label: 'New Engine', url: 'https://example.com/search?q={query}' },
  ];

  const newContent = renderSearchEngines(
    engines,
    () => updateSearchEngines(config),
    () => addSearchEngine(renderer, config),
    (code) => deleteSearchEngine(code, renderer, config),
  );

  renderer.update(newContent);
}

function deleteSearchEngine(code: string, renderer: Renderer, config: IConfig) {
  const engines = config.searchEngines.filter((engine) => engine.code !== code);
  const newContent = renderSearchEngines(
    engines,
    () => updateSearchEngines(config),
    () => addSearchEngine(renderer, config),
    (code) => deleteSearchEngine(code, renderer, config),
  );

  renderer.update(newContent);
}
