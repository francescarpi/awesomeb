import '#/web-components';
import { createButton, addClickEventListenerToButton, ABInput } from '#/web-components';
import { IConfig, TWindowId } from '~/types';
import { addRowCell, createTableRow } from '../tables';
import { createIcon } from '../icons';
import { slugify } from '#/scripts';
import Up from '#/icons/up.svg';
import Down from '#/icons/down.svg';
import Delete from '#/icons/delete.svg';

export function initSearchEngines(winId: TWindowId, config: IConfig) {
  fillSearchEngines(winId, config);

  const btnAdd = document.getElementById('add-search-engine') as HTMLButtonElement;

  addClickEventListenerToButton(btnAdd, () => {
    const table = document.getElementById('search-engines-table') as HTMLTableElement;

    const existingBlankRow = table.querySelector('.blank-row');
    if (existingBlankRow) {
      const input = existingBlankRow.querySelector('ab-input') as ABInput;
      input.focus();
      return;
    }

    const tbody = table.querySelector('tbody') as HTMLTableSectionElement;

    const { row, inputLabel, inputURL } = createEditAddRow(
      () => {
        if (
          !inputLabel.value ||
          inputLabel.value.trim() === '' ||
          !inputURL.value ||
          inputURL.value.trim() === ''
        ) {
          return;
        }

        const newEngine = {
          code: slugify(inputLabel.value),
          label: inputLabel.value,
          url: inputURL.value,
        };

        const newConfig = { ...config };
        newConfig.searchEngines = [...newConfig.searchEngines, newEngine];

        fillSearchEngines(winId, newConfig);
        abConfig.save(winId, newConfig);
      },
      () => {
        tbody.removeChild(row);
      },
    );
    tbody.appendChild(row);
    inputLabel.focus();
  });
}

function fillSearchEngines(winId: TWindowId, config: IConfig) {
  const table = document.getElementById('search-engines-table') as HTMLTableElement;
  const tbody = table.querySelector('tbody') as HTMLTableSectionElement;
  tbody.innerHTML = '';

  config.searchEngines.forEach((engine) => {
    const row = createTableRow(engine.code);
    addRowCell(row, engine.label, 200);
    addRowCell(row, engine.url);

    const actions = document.createElement('div');
    actions.classList.add('ab-flex-2-end');

    const btnEdit = createButton('Edit', { fullWidth: true });

    const btnMoveUp = createButton(createIcon(Up.src), {
      onClick: () => handleAction(winId, moveSearchEngine.bind(null, config, engine.code, 'up')),
    });

    const btnMoveDown = createButton(createIcon(Down.src), {
      onClick: () => handleAction(winId, moveSearchEngine.bind(null, config, engine.code, 'down')),
    });

    const btnRemove = createButton(createIcon(Delete.src), {
      requireConfirmation: true,
      onClick: () => handleAction(winId, deleteSearchEngine.bind(null, config, engine.code)),
    });

    actions.appendChild(btnEdit);
    actions.appendChild(btnMoveUp);
    actions.appendChild(btnMoveDown);
    actions.appendChild(btnRemove);

    addRowCell(row, actions);
    tbody.appendChild(row);
  });
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

function createEditAddRow(
  handleAccept: () => void,
  handleCancel: () => void,
): {
  row: HTMLTableRowElement;
  inputLabel: ABInput;
  inputURL: ABInput;
} {
  const row = document.createElement('tr');
  row.classList.add('blank-row');

  const { td: tdLabel, input: inputLabel } = createInputWithinTd('search-engine-label', 'Label');
  const { td: tdURL, input: inputURL } = createInputWithinTd('search-engine-url', 'URL');

  const btnAccept = createButton('Accept', { onClick: handleAccept });
  const btnCancel = createButton('Cancel', { onClick: handleCancel });

  const tdActions = document.createElement('td');
  tdActions.classList.add('ab-flex-2-start');
  tdActions.appendChild(btnAccept);
  tdActions.appendChild(btnCancel);

  row.appendChild(tdLabel);
  row.appendChild(tdURL);
  row.appendChild(tdActions);

  return { row, inputLabel, inputURL };
}

function createInputWithinTd(
  id: string,
  placeholder: string,
): { td: HTMLTableCellElement; input: ABInput } {
  const td = document.createElement('td');

  const input = document.createElement('ab-input');
  input.id = id;
  input.placeholder = placeholder;

  td.appendChild(input);

  return { td, input };
}
