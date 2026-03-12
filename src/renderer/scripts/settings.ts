import { IConfig } from '~/types';

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
    addRowCell(row, '');
    tbody.appendChild(row);
  });
}

function createTableRow(id: string): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.id = id;
  return row;
}

function addRowCell(row: HTMLTableRowElement, text: string) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.appendChild(cell);
}
