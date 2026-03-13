import { IConfig } from '~/types';
import Up from '#/icons/up.svg';
import Down from '#/icons/down.svg';
import Delete from '#/icons/delete.svg';

export async function settingsManager(winId: number) {
  const config = await abConfig.get(winId);
  fillSearchEngines(config);
}

function fillSearchEngines(config: IConfig) {
  const table = document.getElementById('search-engines-table') as HTMLTableElement;
  const tbody = table.querySelector('tbody') as HTMLTableSectionElement;
  tbody.innerHTML = '';

  config.searchEngines.forEach((engine) => {
    const row = createTableRow(engine.code);
    addRowCell(row, engine.label);
    addRowCell(row, engine.url);

    const actions = document.createElement('div');
    actions.classList.add('flex', 'justify-end', 'gap-2');

    const btnEdit = createButton('Edit', () => {});
    const moveUp = createButton(createIcon(Up.src), () => {});
    const moveDown = createButton(createIcon(Down.src), () => {});
    // TODO this button requires double confirmation
    const remove = createButton(createIcon(Delete.src), () => {});

    actions.appendChild(btnEdit);
    actions.appendChild(moveUp);
    actions.appendChild(moveDown);
    actions.appendChild(remove);

    addRowCell(row, actions);
    tbody.appendChild(row);
  });
}

function createTableRow(id: string): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.id = id;
  return row;
}

function addRowCell(row: HTMLTableRowElement, text: string | HTMLElement) {
  const cell = document.createElement('td');
  if (typeof text === 'string') {
    cell.textContent = text;
  } else {
    cell.appendChild(text);
  }
  row.appendChild(cell);
}

function createButton(label: string | HTMLElement, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  if (typeof label === 'string') {
    button.textContent = label;
  } else {
    button.appendChild(label);
  }
  button.classList.add('btn', 'btn-xs');
  button.addEventListener('click', onClick);
  return button;
}

function createIcon(icon: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = icon;
  img.classList.add('w-4', 'h-4');
  return img;
}
