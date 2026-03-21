import { IConfig, TWindowId } from '~/types';
import Up from '#/icons/up.svg';
import Down from '#/icons/down.svg';
import Delete from '#/icons/delete.svg';
import { createButton } from '../buttons';
import { createIcon } from '../icons';

export function initSearchEngines(winId: TWindowId, config: IConfig) {
  fillSearchEngines(winId, config);

  // TODO call function to manage btnAdd
}

function fillSearchEngines(winId: TWindowId, config: IConfig) {
  const table = document.getElementById('search-engines-table') as HTMLTableElement;
  const tbody = table.querySelector('tbody') as HTMLTableSectionElement;
  tbody.innerHTML = '';

  config.searchEngines.forEach((engine) => {
    const row = createTableRow(engine.code);
    addRowCell(row, engine.label);
    addRowCell(row, engine.url);

    const actions = document.createElement('div');
    actions.classList.add('flex', 'justify-end', 'gap-2');

    const btnEdit = createButton('Edit');

    const moveUp = createButton(createIcon(Up.src), {
      onClick: handleAction.bind(
        null,
        winId,
        moveSearchEngine.bind(null, config, engine.code, 'up'),
      ),
    });

    const moveDown = createButton(createIcon(Down.src), {
      onClick: handleAction.bind(
        null,
        winId,
        moveSearchEngine.bind(null, config, engine.code, 'down'),
      ),
    });

    const remove = createButton(createIcon(Delete.src), {
      doubleConfirmation: true,
      onClick: handleAction.bind(null, winId, deleteSearchEngine.bind(null, config, engine.code)),
    });

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

async function handleAction(winId: TWindowId, action: CallableFunction) {
  const newConfig = action();
  if (newConfig) {
    fillSearchEngines(winId, newConfig);
    abConfig.save(winId, newConfig);
  }
}

function moveSearchEngine(config: IConfig, code: string, direction: 'up' | 'down'): IConfig | null {
  const configCopy = { ...config };
  const seCopy = [...configCopy.searchEngines];
  const itemIdx = seCopy.findIndex((i) => i.code === code);
  if (itemIdx === -1) {
    return null;
  }

  if (direction === 'up' && itemIdx === 0) {
    return null;
  }

  if (direction === 'down' && itemIdx === seCopy.length - 1) {
    return null;
  }

  const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
  [seCopy[itemIdx], seCopy[targetIdx]] = [seCopy[targetIdx], seCopy[itemIdx]];

  configCopy.searchEngines = seCopy;

  return configCopy;
}

function deleteSearchEngine(config: IConfig, code: string): IConfig | null {
  const configCopy = { ...config };
  const seCopy = [...configCopy.searchEngines];
  const itemIdx = seCopy.findIndex((i) => i.code === code);

  if (itemIdx === -1) {
    return null;
  }

  seCopy.splice(itemIdx, 1);

  configCopy.searchEngines = seCopy;

  return configCopy;
}
