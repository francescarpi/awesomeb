import { TEntityType, IEntity } from '~/types';
import { getSearchParams } from './url';

export async function manageListWithSearch(
  listEl: HTMLElement,
  entity: TEntityType,
  onAccept: (item: IEntity) => void,
  onEscape: () => void,
  renderExtra?: (item: IEntity, el: HTMLElement) => void,
) {
  // Validate elements
  const tpl = listEl.querySelector('#row-template') as HTMLTemplateElement;
  if (!tpl) throw new Error('Row template not found in list element');

  const ul = listEl.querySelector('ul');
  if (!ul) throw new Error('UL element not found in list element');

  const input = listEl.querySelector('input');
  if (!input) throw new Error('Input element not found in list element');

  // Load entities & render
  const { winId } = getSearchParams();
  const originalEntities = await abEntities.fetch<IEntity>(winId, entity);
  let filteredEntities = originalEntities;
  renderEntity(ul, tpl, filteredEntities, renderExtra);

  // Initial selection
  const entitySelectedIndex = originalEntities.findIndex((ent) => ent.selected);
  let indexSelected = entitySelectedIndex >= 0 ? entitySelectedIndex : 0;
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
      const selectedEntity = filteredEntities[indexSelected];
      onAccept(selectedEntity);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (input.value.length > 0) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        onEscape();
      }
    }
  });

  // handle input change
  input.addEventListener('input', () => {
    filteredEntities = originalEntities.filter((ent) =>
      ent.label.toLowerCase().includes(input.value.toLowerCase()),
    );

    renderEntity(ul, tpl, filteredEntities, renderExtra);
    indexSelected = 0;
    selectItemAtIndex(ul, indexSelected);
  });
}

function selectItemAtIndex(ul: HTMLElement, index: number) {
  const items = ul.querySelectorAll('li');
  items.forEach((item, i) => {
    if (i === index) {
      item.classList.add('bg-white/20');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('bg-white/20');
    }
  });
}

function renderEntity(
  ul: HTMLElement,
  tpl: HTMLTemplateElement,
  entities: IEntity[],
  renderExtra?: (item: IEntity, el: HTMLElement) => void,
) {
  ul.innerHTML = '';
  for (const item of entities) {
    const clone = tpl.content.cloneNode(true) as HTMLElement;
    const extra = clone.querySelector('small') as HTMLElement;

    const container = clone.querySelector('p') as HTMLElement;
    container.textContent = item.label;

    if (item.extra) {
      extra.textContent = `(${item.extra})`;
    }

    if (renderExtra) {
      renderExtra(item, extra);
    }

    ul.appendChild(clone);
  }
}
