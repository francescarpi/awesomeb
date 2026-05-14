import { h, Renderer, c, type VNode, btnIcon } from '#/scripts';
import type { IConfig, IConfigTheme } from '~/types';
import { box, inputColorPicker } from './common';
import Delete from '#/icons/delete.svg?raw';
import ColorPicker from '@thednp/color-picker';

const { init, selector } = ColorPicker;

//-----------------------------------------------------------------------------
export function renderThemesPage(config: IConfig): { renderer: Renderer; callback: () => void } {
  const renderer = new Renderer(
    buildGeneralBody(config.themes, {
      onSave: () => saveChanges(config),
      onDelete: (name) => deleteTheme(name, renderer, config),
      onAdd: () => addTheme(renderer, config),
    }),
  );

  const callback = () => document.querySelectorAll(selector).forEach(init);

  return { renderer, callback };
}

//-----------------------------------------------------------------------------
function buildGeneralBody(
  themes: IConfigTheme[],
  callbacks: { onSave: () => Promise<void>; onDelete: (name: string) => void; onAdd: () => void },
): VNode {
  return h(
    'div',
    { class: c('flex', 'flex-col', 'gap-2', 'text-sm') },
    box(
      'Themes',
      'Manage custom themes to personalize the appearance of your desktops.',
      h(
        'div',
        { class: c('flex', 'flex-col', 'gap-2') },
        h(
          'table',
          { class: c('w-full', 'border-collapse'), id: 'themes-table' },
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              h('th', { class: c('text-left', 'px-1') }, 'Name'),
              h('th', { class: c('text-left', 'px-1') }, 'Primary'),
              h('th', { class: c('text-left', 'px-1') }, 'Secondary'),
              h('th', { class: c('text-left', 'px-1') }, 'Degrees'),
              h('th', { class: c('w-6') }, ''),
            ),
          ),
          h(
            'tbody',
            {},
            ...themes.map((theme, idx) =>
              h(
                'tr',
                { 'data-name': theme.name },
                h(
                  'td',
                  { class: c('p-0.5') },
                  h(
                    'input',
                    {
                      value: theme.name,
                      class: c('outline-none', 'bg-white/10', 'px-2', 'py-1', 'w-full'),
                    },
                    '',
                  ),
                ),
                h('td', { class: c('p-0.5') }, inputColorPicker(theme.primary, ['w-full'])),
                h('td', { class: c('p-0.5') }, inputColorPicker(theme.secondary, ['w-full'])),
                h(
                  'td',
                  { class: c('px-1') },
                  h(
                    'div',
                    { class: c('flex', 'items-center') },
                    h(
                      'input',
                      {
                        type: 'range',
                        min: 0,
                        max: 360,
                        value: theme.degrees,
                        oninput: updateDegrees,
                      },
                      '',
                    ),
                    h('span', { class: c('ml-2', 'w-13') }, `${theme.degrees}°`),
                  ),
                ),
                h(
                  'td',
                  { class: c(idx === 0 && 'hidden') },
                  btnIcon(Delete, { onClick: callbacks.onDelete.bind(null, theme.name) }),
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
      { class: c('flex', 'justify-end') },
      h('button', { class: c('btn', 'btn-primary'), onclick: callbacks.onSave }, 'Save changes'),
    ),
  );
}

//-----------------------------------------------------------------------------
function buildGeneralCallbacks(renderer: Renderer, config: IConfig) {
  return {
    onSave: () => saveChanges(config),
    onDelete: (name: string) => deleteTheme(name, renderer, config),
    onAdd: () => addTheme(renderer, config),
  };
}

//-----------------------------------------------------------------------------
async function saveChanges(config: IConfig) {
  const themes = getTableThemes();
  const newConfig = { ...config, themes };
  await abConfig.save(newConfig);
}

//-----------------------------------------------------------------------------
function deleteTheme(name: string, renderer: Renderer, config: IConfig) {
  const themes = getTableThemes().filter((t) => t.name !== name);
  renderer.update(buildGeneralBody(themes, buildGeneralCallbacks(renderer, config)));
}

//-----------------------------------------------------------------------------
function getTableThemes(): IConfigTheme[] {
  const table = document.getElementById('themes-table') as HTMLTableElement;
  const rows = Array.from(table.tBodies[0].rows);
  const themes: IConfigTheme[] = [];

  for (const row of rows) {
    const name = (row.cells[0].firstChild as HTMLInputElement).value.trim();
    if (!name) continue;

    const primary =
      (row.cells[1].querySelector('input[data-function="color-picker"]') as HTMLInputElement)
        ?.value || '#000000';

    const secondary =
      (row.cells[2].querySelector('input[data-function="color-picker"]') as HTMLInputElement)
        ?.value || '#ffffff';

    const degrees = parseInt(
      (row.cells[3].querySelector('input[type="range"]') as HTMLInputElement).value,
      10,
    );

    themes.push({ name, primary, secondary, degrees });
  }

  return themes;
}

//-----------------------------------------------------------------------------
function addTheme(renderer: Renderer, config: IConfig) {
  const themes = getTableThemes();
  if (themes.some((t) => t.name === 'New')) return;

  const newThemes: IConfigTheme[] = [
    ...themes,
    { name: 'New', primary: '#000000', secondary: '#ffffff', degrees: 0 },
  ];

  renderer.update(buildGeneralBody(newThemes, buildGeneralCallbacks(renderer, config)), {
    onUpdated: () => {
      const lastRow = (document.getElementById('themes-table') as HTMLTableElement).tBodies[0]
        .lastElementChild as HTMLTableRowElement;

      lastRow.querySelectorAll('[data-function="color-picker"]').forEach(init);
    },
  });
}

//-----------------------------------------------------------------------------
function updateDegrees(e: Event) {
  const input = e.target as HTMLInputElement;
  const span = input.closest('td')!.querySelector('span') as HTMLSpanElement;
  span.textContent = `${input.value}°`;
}
