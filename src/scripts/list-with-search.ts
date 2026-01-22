import { TListWithSearchEntity, IListWithSearchEntity } from '@shared/types';
import { getWinId } from './window';

export async function manageListWithSearch(
  listEl: HTMLElement,
  entity: TListWithSearchEntity,
  callback: (item: IListWithSearchEntity) => void,
) {
  // Validate elements
  const tpl = listEl.querySelector('#row-template') as HTMLTemplateElement;
  if (!tpl) throw new Error('Row template not found in list element');

  const ul = listEl.querySelector('ul');
  if (!ul) throw new Error('UL element not found in list element');

  const input = listEl.querySelector('input');
  if (!input) throw new Error('Input element not found in list element');

  // Load entities & render
  const winId = getWinId();
  const entities = await abListWithSearch.getEntities(winId, entity);
  renderCommands(ul, tpl, entities);

  // Initial selection
  let indexSelected = 0;
  selectItemAtIndex(ul, indexSelected);

  // Handle keyboard navigation
  input.addEventListener('keydown', (e) => {
    const items = ul.querySelectorAll('li');
    if (e.key === 'ArrowDown' || e.key === 'J') {
      e.preventDefault();
      indexSelected = (indexSelected + 1) % items.length;
      selectItemAtIndex(ul, indexSelected);
    } else if (e.key === 'ArrowUp' || e.key === 'K') {
      e.preventDefault();
      indexSelected = (indexSelected - 1 + items.length) % items.length;
      selectItemAtIndex(ul, indexSelected);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedEntity = entities[indexSelected];
      callback(selectedEntity);
    }

    // Fix scrolling to selected item
    const selectedItem = items[indexSelected] as HTMLElement;
    selectedItem.scrollIntoView({ block: 'nearest' });
  });

  // handle input change
  input.addEventListener('input', () => {
    const entitiesFiltered = entities.filter((ent) =>
      ent.label.toLowerCase().includes(input.value.toLowerCase()),
    );

    renderCommands(ul, tpl, entitiesFiltered);
    indexSelected = 0;
    selectItemAtIndex(ul, indexSelected);
  });
}

function selectItemAtIndex(ul: HTMLElement, index: number) {
  const items = ul.querySelectorAll('li');
  items.forEach((item, i) => {
    if (i === index) {
      item.classList.add('bg-white/20');
    } else {
      item.classList.remove('bg-white/20');
    }
  });
}

function renderCommands(
  ul: HTMLElement,
  tpl: HTMLTemplateElement,
  entities: IListWithSearchEntity[],
) {
  ul.innerHTML = '';
  for (const [i, item] of entities.entries()) {
    const clone = tpl.content.cloneNode(true) as HTMLElement;

    const container = clone.querySelector('p') as HTMLElement;
    container.textContent = item.label;

    if (item.extra) {
      const container = clone.querySelector('small') as HTMLElement;
      container.textContent = `(${item.extra})`;
    }

    ul.appendChild(clone);
  }
}
