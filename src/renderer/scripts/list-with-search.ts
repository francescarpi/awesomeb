import { TEntityType, IEntity } from '~/types';
import { getSearchParams } from './url';

export async function listWithSearchManager(
  listElId: string,
  props: {
    entity: TEntityType;
    onAccept?: (item: IEntity) => void;
    onEscape?: () => void;
    onTab?: () => void;
    onShiftTab?: () => void;
    renderExtra?: (item: IEntity, el: HTMLElement) => void;
    filtering?: boolean;
    onChange?: (inputValue: string, entity: IEntity) => void;
  },
) {
  const listEl = document.getElementById(listElId)!;

  // Validate elements
  const tpl = listEl.querySelector('#row-template') as HTMLTemplateElement;
  const ul = listEl.querySelector('ul');
  const input = listEl.querySelector('input');

  if (!tpl) throw new Error('Row template not found in list element');
  if (!ul) throw new Error('UL element not found in list element');
  if (!input) throw new Error('Input element not found in list element');

  // Load entities & render
  const { winId } = getSearchParams();
  const originalEntities = await abEntities.fetch<IEntity>(winId, props.entity);

  if (props.onChange && originalEntities.length > 0) {
    props.onChange(input.value, originalEntities[0]);
  }

  let filteredEntities = originalEntities;
  renderEntity(ul, tpl, filteredEntities, props.renderExtra);

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
      if (props.onChange) props.onChange(input.value, filteredEntities[indexSelected]);
    } else if (e.key === 'ArrowUp' || e.key === 'K') {
      e.preventDefault();
      indexSelected = (indexSelected - 1 + items.length) % items.length;
      selectItemAtIndex(ul, indexSelected);
      if (props.onChange) props.onChange(input.value, filteredEntities[indexSelected]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (props.onAccept) {
        const selectedEntity = filteredEntities[indexSelected];
        props.onAccept(selectedEntity);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (input.value.length > 0) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        if (props.onEscape) {
          props.onEscape();
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (props.onShiftTab) {
          props.onShiftTab();
        }
      } else {
        if (props.onTab) {
          props.onTab();
        }
      }
    }
  });

  // handle input change
  input.addEventListener('input', () => {
    if (props.onChange && filteredEntities.length > 0) {
      props.onChange(input.value, filteredEntities[indexSelected]);
    }

    if (props.filtering === false) {
      return;
    }

    filteredEntities = originalEntities.filter((ent) =>
      ent.label.toLowerCase().includes(input.value.toLowerCase()),
    );

    renderEntity(ul, tpl, filteredEntities, props.renderExtra);
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
