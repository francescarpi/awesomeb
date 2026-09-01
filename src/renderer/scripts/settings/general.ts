import { h, c, Renderer, type VNode, btnIcon, input } from '#/scripts';
import type { IConfig, IConfigSearchEngine } from '~/types';
import { box } from './common';
import slugify from 'slugify';
import Delete from '#/icons/delete.svg?raw';
import { INTERNAL_PROTOCOL } from '~/constants';
import { RETENTION_OPTIONS } from './constants';
import { LOCALES, SUPPORTED_LOCALES } from '~/i18n/constants';

type Translations = Record<string, string>;

const KEYS = [
  'pages:settings.general.saveChanges',
  'pages:settings.general.info.title',
  'pages:settings.general.info.desc',
  'pages:settings.general.info.appVersion',
  'pages:settings.general.info.chromeVersion',
  'pages:settings.general.info.configFolder',
  'pages:settings.general.info.openFolder',
  'pages:settings.general.info.githubRepo',
  'pages:settings.general.engines.title',
  'pages:settings.general.engines.desc',
  'pages:settings.general.engines.name',
  'pages:settings.general.engines.url',
  'pages:settings.general.engines.add',
  'pages:settings.general.engines.newEngine',
  'pages:settings.general.downloads.title',
  'pages:settings.general.downloads.desc',
  'pages:settings.general.downloads.location',
  'pages:settings.general.downloads.change',
  'pages:settings.general.language.title',
  'pages:settings.general.language.desc',
  'pages:settings.general.language.restartNote',
  'pages:settings.general.historyRetention.title',
  'pages:settings.general.historyRetention.desc',
  'pages:settings.general.historyRetention.manageHistory',
  'pages:settings.general.closedTabsRetention.title',
  'pages:settings.general.closedTabsRetention.desc',
  'pages:settings.general.days_one',
  'pages:settings.general.days_other',
];

/** i18next plural forms are fetched raw because the batch IPC maps results by
 * key, so per-count resolution must happen client-side. */
function formatDays(t: Translations, days: number): string {
  const template =
    days === 1 ? t['pages:settings.general.days_one'] : t['pages:settings.general.days_other'];
  return template.replace('{{count}}', String(days));
}

//-----------------------------------------------------------------------------
export async function renderGeneralPage(config: IConfig): Promise<{
  renderer: Renderer;
  callback: () => void;
}> {
  const t = await abI18n.t(
    { winId: -1 },
    KEYS.map((key) => ({ key })),
  );
  const renderer = new Renderer(
    await buildGeneralBody(
      config.searchEngines,
      config.downloadsFolder,
      config,
      {
        onSave: () => saveChanges(config),
        onAdd: () => addSearchEngine(renderer, config, t),
        onDelete: (code) => deleteSearchEngine(code, renderer, config, t),
        onSelectDownloadLocation: () => selectDownloadLocation(renderer, config, t),
      },
      t,
    ),
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
  t: Translations,
): Promise<VNode> {
  return h(
    'div',
    { class: c('flex', 'flex-col', 'gap-2') },
    await renderConfigFolder(t),
    renderSearchEngines(engines, callbacks.onAdd, callbacks.onDelete, t),
    h(
      'div',
      { class: c('flex', 'gap-2') },
      renderDownloadLocation(config, downloadLocation, callbacks.onSelectDownloadLocation, t),
      renderLocale(config, t),
    ),
    h(
      'div',
      { class: c('flex', 'gap-2') },
      renderHistoryRetention(config, t),
      renderClosedTabsRetention(config, t),
    ),
    h(
      'div',
      { class: c('flex', 'justify-end') },
      h(
        'button',
        { class: c('btn', 'btn-sm', 'btn-primary'), onclick: callbacks.onSave },
        t['pages:settings.general.saveChanges'],
      ),
    ),
  );
}

//-----------------------------------------------------------------------------
function buildGeneralCallbacks(renderer: Renderer, config: IConfig, t: Translations) {
  return {
    onSave: () => saveChanges(config),
    onAdd: () => addSearchEngine(renderer, config, t),
    onDelete: (code: string) => deleteSearchEngine(code, renderer, config, t),
    onSelectDownloadLocation: () => selectDownloadLocation(renderer, config, t),
  };
}

//-----------------------------------------------------------------------------
async function renderConfigFolder(t: Translations): Promise<VNode> {
  const info = await abConfig.getConfigInfo();
  return box(
    t['pages:settings.general.info.title'],
    t['pages:settings.general.info.desc'],
    h(
      'div',
      { class: c('text-md', 'flex', 'flex-col', 'gap-2') },
      h(
        'div',
        { class: c('flex', 'gap-2') },
        h('span', null, t['pages:settings.general.info.appVersion']),
        h('span', { class: c('font-bold') }, info.version),
      ),
      h(
        'div',
        { class: c('flex', 'gap-2') },
        h('span', null, t['pages:settings.general.info.chromeVersion']),
        h('span', { class: c('font-bold') }, info.chromeVersion),
      ),
      h(
        'div',
        { class: c('flex', 'gap-2', 'items-center') },
        h('span', null, t['pages:settings.general.info.configFolder']),
        h('span', { class: c('font-bold') }, info.configPath),
        h(
          'button',
          { class: c('btn', 'btn-xs'), onclick: () => abConfig.openConfigFolder() },
          t['pages:settings.general.info.openFolder'],
        ),
      ),
      info.repoUrl
        ? h(
            'div',
            { class: c('flex', 'gap-2', 'items-center') },
            h('span', null, t['pages:settings.general.info.githubRepo']),
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
  t: Translations,
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
        h('th', { class: c('text-left', 'px-1') }, t['pages:settings.general.engines.name']),
        h('th', { class: c('text-left', 'px-1') }, t['pages:settings.general.engines.url']),
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
    t['pages:settings.general.engines.title'],
    t['pages:settings.general.engines.desc'],
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
          t['pages:settings.general.engines.add'],
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
  t: Translations,
): VNode {
  return box(
    t['pages:settings.general.downloads.title'],
    t['pages:settings.general.downloads.desc'],
    h(
      'div',
      { class: c('flex', 'gap-2', 'items-center') },
      input(
        'downloads-location',
        t['pages:settings.general.downloads.location'],
        downloadsLocation || config.downloadsFolder,
        {
          width: 'w-92',
          readonly: true,
        },
      ),
      h(
        'button',
        { class: c('btn', 'btn-sm', 'btn-primary'), onClick: handleChange },
        t['pages:settings.general.downloads.change'],
      ),
    ),
  );
}

//-----------------------------------------------------------------------------
function renderLocale(config: IConfig, t: Translations): VNode {
  return box(
    t['pages:settings.general.language.title'],
    t['pages:settings.general.language.desc'],
    h(
      'div',
      { class: c('flex', 'flex-col', 'gap-2') },
      h(
        'select',
        {
          id: 'app-locale',
          class: c('select', 'select-sm', 'select-bordered', 'w-32'),
        },
        ...SUPPORTED_LOCALES.map((locale) =>
          h(
            'option',
            {
              value: locale,
              selected: locale === config.locale,
            },
            LOCALES.get(locale),
          ),
        ),
      ),
      h('small', {}, t['pages:settings.general.language.restartNote']),
    ),
  );
}

//-----------------------------------------------------------------------------
function renderHistoryRetention(config: IConfig, t: Translations): VNode {
  const currentValue = config.historyRetentionDays ?? 7;

  return box(
    t['pages:settings.general.historyRetention.title'],
    t['pages:settings.general.historyRetention.desc'],
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
            formatDays(t, days),
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
        t['pages:settings.general.historyRetention.manageHistory'],
      ),
    ),
  );
}

//-----------------------------------------------------------------------------
function renderClosedTabsRetention(config: IConfig, t: Translations): VNode {
  const currentValue = config.closedTabsRetentionDays ?? 7;

  return box(
    t['pages:settings.general.closedTabsRetention.title'],
    t['pages:settings.general.closedTabsRetention.desc'],
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
            formatDays(t, days),
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

  // Locale
  const localeSelect = document.getElementById('app-locale') as HTMLSelectElement;
  const locale = localeSelect.value;

  const newConfig = {
    ...config,
    searchEngines,
    downloadsFolder,
    historyRetentionDays,
    closedTabsRetentionDays,
    locale,
  };
  await abConfig.save(newConfig);
}

//-----------------------------------------------------------------------------
async function addSearchEngine(renderer: Renderer, config: IConfig, t: Translations) {
  const engines = getTableSearchEngines();
  if (engines.some((engine) => engine.code === 'new-engine')) {
    return;
  }

  const newEngines: IConfigSearchEngine[] = [
    ...engines,
    {
      code: 'new-engine',
      label: t['pages:settings.general.engines.newEngine'],
      url: 'https://example.com/search?q={query}',
    },
  ];

  renderer.update(
    await buildGeneralBody(
      newEngines,
      config.downloadsFolder,
      config,
      buildGeneralCallbacks(renderer, config, t),
      t,
    ),
  );
}

//-----------------------------------------------------------------------------
async function deleteSearchEngine(
  code: string,
  renderer: Renderer,
  config: IConfig,
  t: Translations,
) {
  const engines = getTableSearchEngines().filter((engine) => engine.code !== code);
  renderer.update(
    await buildGeneralBody(
      engines,
      config.downloadsFolder,
      config,
      buildGeneralCallbacks(renderer, config, t),
      t,
    ),
  );
}

//-----------------------------------------------------------------------------
async function selectDownloadLocation(renderer: Renderer, config: IConfig, t: Translations) {
  const folder = await abConfig.selectDownloadFolder();
  if (folder) {
    renderer.update(
      await buildGeneralBody(
        config.searchEngines,
        folder,
        config,
        buildGeneralCallbacks(renderer, config, t),
        t,
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
