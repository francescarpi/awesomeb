import { box } from '../common';
import type { IConfig, IConfigSearchEngine, TWindowId } from '~/types';
import { type VNode, h, c } from '#/scripts';

export function renderSearchEngines(winId: TWindowId, config: IConfig): VNode {
  return box(
    'Search Engines',
    'Configuration for search engines',
    h(
      'div',
      { class: c('text-sm', 'flex', 'flex-col', 'gap-2') },
      h(
        'table',
        { class: c('w-full', 'border-collapse'), id: 'search-engines-table' },
        h(
          'thead',
          {},
          h(
            'tr',
            {},
            h('th', { class: c('text-left', 'p-0.5') }, 'Name'),
            h('th', { class: c('text-left', 'p-0.5') }, 'URL'),
            h('th', {}, ''),
          ),
        ),
        h(
          'tbody',
          {},
          ...config.searchEngines.map((engine) =>
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
                    class: c('outline-none', 'bg-white/10', 'px-0.5', 'w-full'),
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
                    class: c('outline-none', 'bg-white/10', 'px-0.5', 'w-full'),
                  },
                  '',
                ),
              ),
              h('td', {}, ''),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: c('flex', 'justify-between') },
        h('button', { class: c('btn', 'btn-xs', 'btn-outline') }, 'Add'),
        h(
          'button',
          {
            class: c('btn', 'btn-xs', 'btn-primary'),
            onclick: () => updateSearchEngines(winId, config),
          },
          'Save Changes',
        ),
      ),
    ),
  );
}

async function updateSearchEngines(winId: TWindowId, config: IConfig) {
  const table = document.getElementById('search-engines-table') as HTMLTableElement;
  const searchEnginesRows = Array.from(table.tBodies[0].rows);

  const searchEngines: IConfigSearchEngine[] = [];
  for (const row of searchEnginesRows) {
    const code = row.dataset.code;
    const label = (row.cells[0].firstChild as HTMLInputElement).value;
    const url = (row.cells[1].firstChild as HTMLInputElement).value;
    if (code && label && url && label.trim() && url.trim()) {
      searchEngines.push({ code, label, url });
    }
  }

  const newConfig = { ...config, searchEngines };
  await abConfig.save(winId, newConfig);
}
