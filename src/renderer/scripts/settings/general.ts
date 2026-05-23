import { h, c, Renderer, type VNode, btnIcon, input } from '#/scripts';
import type { IConfig, IConfigSearchEngine } from '~/types';
import { box } from './common';
import slugify from 'slugify';
import Delete from '#/icons/delete.svg?raw';
import { INTERNAL_PROTOCOL } from '~/constants';

//-----------------------------------------------------------------------------
export async function renderGeneralPage(config: IConfig): Promise<{
  renderer: Renderer;
  callback: () => void;
}> {
  const renderer = new Renderer(
    buildGeneralBody(config.searchEngines, config.downloadsFolder, config, {
      onSave: () => saveChanges(config),
      onAdd: () => addSearchEngine(renderer, config),
      onDelete: (code) => deleteSearchEngine(code, renderer, config),
      onSelectDownloadLocation: () => selectDownloadLocation(renderer, config),
    }),
  );

  const callback = () => {};

  return { renderer, callback };
}

//-----------------------------------------------------------------------------
function buildGeneralBody(
  engines: IConfigSearchEngine[],
  downloadLocation: string | null,
  config: IConfig,
  callbacks: {
    onSave: () => Promise<void>;
    onAdd: () => void;
    onDelete: (code: string) => void;
    onSelectDownloadLocation: () => void;
  },
): VNode {
  return h(
    'div',
    { class: c('flex', 'flex-col', 'gap-2') },
    renderSearchEngines(engines, callbacks.onAdd, callbacks.onDelete),
    renderDownloadLocation(config, downloadLocation, callbacks.onSelectDownloadLocation),
    renderHistoryRetention(config),
    h(
      'div',
      { class: c('flex', 'justify-end') },
      h(
        'button',
        { class: c('btn', 'btn-sm', 'btn-primary'), onclick: callbacks.onSave },
        'Save changes',
      ),
    ),
  );
}

//-----------------------------------------------------------------------------
function buildGeneralCallbacks(renderer: Renderer, config: IConfig) {
  return {
    onSave: () => saveChanges(config),
    onAdd: () => addSearchEngine(renderer, config),
    onDelete: (code: string) => deleteSearchEngine(code, renderer, config),
    onSelectDownloadLocation: () => selectDownloadLocation(renderer, config),
  };
}

//-----------------------------------------------------------------------------
function renderSearchEngines(
  searchEngines: IConfigSearchEngine[],
  handleAdd: () => void,
  handleDelete: (code: string) => void,
): VNode {
  const engines = h(
    'table',
    { class: c('table'), id: 'search-engines-table' },
    h(
      'thead',
      {},
      h(
        'tr',
        {},
        h('th', { class: c('text-left', 'px-1') }, 'Name'),
        h('th', { class: c('text-left', 'px-1') }, 'URL'),
        h('th', { class: c('w-4') }, ''),
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
                class: c('input', 'input-sm', 'w-full'),
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
                class: c('input', 'input-sm', 'w-full'),
                type: 'url',
              },
              '',
            ),
          ),
          h(
            'td',
            { class: c(idx === 0 && 'hidden') },
            btnIcon(Delete, {
              onClick: handleDelete.bind(null, engine.code),
              doubleConfirmation: true,
            }),
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
        h('button', { class: c('btn', 'btn-sm', 'btn-outline'), onclick: handleAdd }, 'Add'),
      ),
    ),
  );
}

//-----------------------------------------------------------------------------
function renderDownloadLocation(
  config: IConfig,
  downloadsLocation: string | null,
  handleChange: () => void,
): VNode {
  return box(
    'Download Location',
    'Set the default download location for files.',
    h(
      'div',
      { class: c('flex', 'gap-2', 'items-center') },
      input('downloads-location', 'Location', downloadsLocation || config.downloadsFolder, {
        width: 'w-92',
        readonly: true,
      }),
      h('button', { class: c('btn', 'btn-sm', 'btn-primary'), onClick: handleChange }, 'Change'),
    ),
  );
}

//-----------------------------------------------------------------------------
function renderHistoryRetention(config: IConfig): VNode {
  const options = [7, 15, 30, 60, 90];
  const currentValue = config.historyRetentionDays ?? 7;

  return box(
    'History Retention',
    'Number of days to keep browsing history.',
    h(
      'div',
      { class: c('flex', 'gap-2') },
      h(
        'select',
        {
          id: 'history-retention-days',
          class: c('select', 'select-sm', 'select-bordered', 'w-32'),
        },
        ...options.map((days) =>
          h(
            'option',
            {
              value: String(days),
              selected: days === currentValue,
            },
            `${days} days`,
          ),
        ),
      ),
      h(
        'a',
        {
          href: `${INTERNAL_PROTOCOL}://history/`,
          class: c('btn', 'btn-sm', 'btn-ghost'),
          target: '_blank',
        },
        'Manage history',
      ),
    ),
  );
}

//-----------------------------------------------------------------------------
async function saveChanges(config: IConfig) {
  // Search engines
  const searchEngines = getTableSearchEngines();

  // Donwloads location
  const downloadsLocationInput = document.getElementById('downloads-location') as HTMLInputElement;
  const downloadsFolder = downloadsLocationInput.value;

  // History retention
  const retentionSelect = document.getElementById('history-retention-days') as HTMLSelectElement;
  const historyRetentionDays = parseInt(retentionSelect.value, 10);

  const newConfig = { ...config, searchEngines, downloadsFolder, historyRetentionDays };
  await abConfig.save(newConfig);
}

//-----------------------------------------------------------------------------
function addSearchEngine(renderer: Renderer, config: IConfig) {
  const engines = getTableSearchEngines();
  if (engines.some((engine) => engine.code === 'new-engine')) {
    return;
  }

  const newEngines: IConfigSearchEngine[] = [
    ...engines,
    { code: 'new-engine', label: 'New Engine', url: 'https://example.com/search?q={query}' },
  ];

  renderer.update(
    buildGeneralBody(
      newEngines,
      config.downloadsFolder,
      config,
      buildGeneralCallbacks(renderer, config),
    ),
  );
}

//-----------------------------------------------------------------------------
function deleteSearchEngine(code: string, renderer: Renderer, config: IConfig) {
  const engines = getTableSearchEngines().filter((engine) => engine.code !== code);
  renderer.update(
    buildGeneralBody(
      engines,
      config.downloadsFolder,
      config,
      buildGeneralCallbacks(renderer, config),
    ),
  );
}

//-----------------------------------------------------------------------------
async function selectDownloadLocation(renderer: Renderer, config: IConfig) {
  const folder = await abConfig.selectDownloadFolder();
  if (folder) {
    renderer.update(
      buildGeneralBody(
        config.searchEngines,
        folder,
        config,
        buildGeneralCallbacks(renderer, config),
      ),
    );
  }
}

//-----------------------------------------------------------------------------
function getTableSearchEngines(): IConfigSearchEngine[] {
  const table = document.getElementById('search-engines-table') as HTMLTableElement;
  const rows = Array.from(table.tBodies[0].rows);
  const searchEngines: IConfigSearchEngine[] = [];

  for (const row of rows) {
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

  return searchEngines;
}
