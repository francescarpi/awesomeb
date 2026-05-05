import { type VNode, h, cls } from '#/scripts';
import { box } from './common';
import type { IConfig } from '~/types';

export function renderGeneralPage(config: IConfig): VNode {
  return h('div', { class: cls('flex', 'flex-col', 'gap-2') }, searchEngines(config));
}

function searchEngines(config: IConfig): VNode {
  return box(
    'Search Engines',
    'Configuration for search engines',
    h(
      'div',
      { class: cls('text-sm') },
      h(
        'table',
        { class: cls('w-full', 'border-collapse') },
        h(
          'thead',
          {},
          h(
            'tr',
            {},
            h('th', { class: cls('text-left', 'p-0.5') }, 'Name'),
            h('th', { class: cls('text-left', 'p-0.5') }, 'URL'),
            h('th', {}, ''),
          ),
        ),
        h(
          'tbody',
          {},
          ...config.searchEngines.map((engine) =>
            h(
              'tr',
              {},
              h(
                'td',
                { class: cls('p-0.5') },
                h(
                  'input',
                  {
                    value: engine.label,
                    class: cls('outline-none', 'bg-white/10', 'px-0.5', 'w-full'),
                  },
                  '',
                ),
              ),
              h(
                'td',
                { class: cls('p-0.5') },
                h(
                  'input',
                  {
                    value: engine.url,
                    class: cls('outline-none', 'bg-white/10', 'px-0.5', 'w-full'),
                  },
                  '',
                ),
              ),
              h('td', {}, ''),
            ),
          ),
        ),
      ),
    ),
  );
}
