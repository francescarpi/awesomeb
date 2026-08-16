import { h, c, Renderer, type VNode, btnIcon, input } from '#/scripts';
import { t } from '#/scripts/i18n';
import type { IConfig, IConfigSearchEngine } from '~/types';
import { box } from './common';
import slugify from 'slugify';
import Delete from '#/icons/delete.svg?raw';
import { INTERNAL_PROTOCOL } from '~/constants';
import { RETENTION_OPTIONS } from './constants';

//-----------------------------------------------------------------------------
export async function renderGeneralPage(config: IConfig): Promise<{
  renderer: Renderer;
  callback: () => void;
}> {
  const renderer = new Renderer(
    await buildGeneralBody(config.searchEngines, config.downloadsFolder, config, {
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
async function buildGeneralBody(
  engines: IConfigSearchEngine[],
  downloadLocation: string | null,
  config: IConfig,
  callbacks: {
    onSave: () => Promise<void>;
    onAdd: () => void;
    onDelete: (code: string) => void;
    onSelectDownloadLocation: () => void;
  },
): Promise<VNode> {
  return h(
    'div',
    { class: c('flex', 'flex-col', 'gap-2') },
    await renderConfigFolder(),
    renderSearchEngines(engines, callbacks.onAdd, callbacks.onDelete),
    renderDownloadLocation(config, downloadLocation, callbacks.onSelectDownloadLocation),
    h(
      'div',
      { class: c('flex', 'gap-2') },
      renderHistoryRetention(config),
      renderClosedTabsRetention(config),
    ),
    h(
      'div',
      { class: c('flex', 'justify-end') },
      h(
        'button',
        { class: c('btn', 'btn-sm', 'btn-primary'), onclick: callbacks.onSave },
        t('pages.settings.general.saveChanges'),
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
async function renderConfigFolder(): Promise<VNode> {
  const info = await abConfig.getConfigInfo();
  return box(
    t('pages.settings.general.informationTitle'),
    t('pages.settings.general.informationDescription'),
    h(
      'div',
      { class: c('text-md', 'flex', 'flex-col', 'gap-2') },
      h(
        'div',
        { class: c('flex', 'gap-2') },
        h('span', null, t('pages.settings.general.appVersion')),
        h('span', { class: c('font-bold') }, info.version),
      ),
      h(
        'div',
        { class: c('flex', 'gap-2') },
        h('span', null, t('pages.settings.general.chromeVersion')),
        h('span', { class: c('font-bold') }, info.chromeVersion),
      ),
      h(
        'div',
        { class: c('flex', 'gap-2', 'items-center') },
        h('span', null, t('pages.settings.general.configFolder')),
        h('span', { class: c('font-bold') }, info.configPath),
        h(
          'button',
          { class: c('btn', 'btn-xs'), onclick: () => abConfig.openConfigFolder() },
          t('pages.settings.general.openFolder'),
        ),
      ),
      info.repoUrl
        ? h(
            'div',
            { class: c('flex', 'gap-2', 'items-center') },
            h('span', null, t('pages.settings.general.githubRepository')),
            h(
              'a',
              {
                href: info.repoUrl,
                class: c('font-bold', 'link', 'link-hover'),
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              info.repoUrl,
            ),
          )
        : null,
    ),
  );
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
        h('th', { class: c('text-left', 'px-1') }, t('pages.settings.general.searchEnginesName')),
        h('th', { class: c('text-left', 'px-1') }, t('pages.settings.general.searchEnginesUrl')),
        h('th', { class: c('w-13') }, ''),
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
    t('pages.settings.general.searchEnginesTitle'),
    t('pages.settings.general.searchEnginesDescription'),
    h(
      'div',
      { class: c('text-sm', 'flex', 'flex-col', 'gap-2') },
      engines,
      h(
        'div',
        { class: c('flex', 'justify-between') },
        h(
          'button',
          { class: c('btn', 'btn-sm', 'btn-outline'), onclick: handleAdd },
          t('pages.settings.general.searchEnginesAdd'),
        ),
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
    t('pages.settings.general.downloadLocationTitle'),
    t('pages.settings.general.downloadLocationDescription'),
    h(
      'div',
      { class: c('flex', 'gap-2', 'items-center') },
      input(
        'downloads-location',
        t('pages.settings.general.downloadLocationPlaceholder'),
        downloadsLocation || config.downloadsFolder,
        {
          width: 'w-92',
          readonly: true,
        },
      ),
      h(
        'button',
        { class: c('btn', 'btn-sm', 'btn-primary'), onClick: handleChange },
        t('pages.settings.general.downloadLocationChange'),
      ),
    ),
  );
}

//-----------------------------------------------------------------------------
function renderHistoryRetention(config: IConfig): VNode {
  const currentValue = config.historyRetentionDays ?? 7;

  return box(
    t('pages.settings.general.historyRetentionTitle'),
    t('pages.settings.general.historyRetentionDescription'),
    h(
      'div',
      { class: c('flex', 'gap-2') },
      h(
        'select',
        {
          id: 'history-retention-days',
          class: c('select', 'select-sm', 'select-bordered', 'w-32'),
        },
        ...RETENTION_OPTIONS.map((days) =>
          h(
            'option',
            {
              value: String(days),
              selected: days === currentValue,
            },
            t('pages.settings.general.historyRetentionDays', { count: days }),
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
        t('pages.settings.general.historyRetentionManage'),
      ),
    ),
  );
}

//-----------------------------------------------------------------------------
function renderClosedTabsRetention(config: IConfig): VNode {
  const currentValue = config.closedTabsRetentionDays ?? 7;

  return box(
    t('pages.settings.general.closedTabsRetentionTitle'),
    t('pages.settings.general.closedTabsRetentionDescription'),
    h(
      'div',
      { class: c('flex', 'gap-2') },
      h(
        'select',
        {
          id: 'closed-tabs-retention-days',
          class: c('select', 'select-sm', 'select-bordered', 'w-32'),
        },
        ...RETENTION_OPTIONS.map((days) =>
          h(
            'option',
            {
              value: String(days),
              selected: days === currentValue,
            },
            t('pages.settings.general.historyRetentionDays', { count: days }),
          ),
        ),
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

  // Closed tabs retention
  const closedTabsRetentionSelect = document.getElementById(
    'closed-tabs-retention-days',
  ) as HTMLSelectElement;
  const closedTabsRetentionDays = parseInt(closedTabsRetentionSelect.value, 10);

  const newConfig = {
    ...config,
    searchEngines,
    downloadsFolder,
    historyRetentionDays,
    closedTabsRetentionDays,
  };
  await abConfig.save(newConfig);
}

//-----------------------------------------------------------------------------
async function addSearchEngine(renderer: Renderer, config: IConfig) {
  const engines = getTableSearchEngines();
  if (engines.some((engine) => engine.code === 'new-engine')) {
    return;
  }

  const newEngines: IConfigSearchEngine[] = [
    ...engines,
    { code: 'new-engine', label: 'New Engine', url: 'https://example.com/search?q={query}' },
  ];

  renderer.update(
    await buildGeneralBody(
      newEngines,
      config.downloadsFolder,
      config,
      buildGeneralCallbacks(renderer, config),
    ),
  );
}

//-----------------------------------------------------------------------------
async function deleteSearchEngine(code: string, renderer: Renderer, config: IConfig) {
  const engines = getTableSearchEngines().filter((engine) => engine.code !== code);
  renderer.update(
    await buildGeneralBody(
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
      await buildGeneralBody(
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
