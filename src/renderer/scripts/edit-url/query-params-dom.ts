/**
 * Creates a single query parameter row element with key input, value input, and delete button.
 *
 * @param key - Initial key value
 * @param value - Initial value value
 * @param onChange - Callback invoked when inputs change or row is deleted
 * @returns The row HTMLElement
 */
export function createQueryParamRow(
  key: string = '',
  value: string = '',
  onChange?: () => void,
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'flex items-center gap-2';

  const keyLabel = document.createElement('label');
  keyLabel.className = 'input text-black w-50 ';

  const keySpan = document.createElement('span');
  keySpan.className = 'w-12';
  keySpan.textContent = 'Key:';
  keyLabel.appendChild(keySpan);

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.className = 'grow query-key';
  keyInput.placeholder = 'Key';
  keyInput.value = key;
  keyInput.addEventListener('input', () => {
    if (onChange) onChange();
  });
  keyLabel.appendChild(keyInput);

  const valueLabel = document.createElement('label');
  valueLabel.className = 'input text-black w-full flex-1';

  const valueSpan = document.createElement('span');
  valueSpan.className = 'w-12';
  valueSpan.textContent = 'Value:';
  valueLabel.appendChild(valueSpan);

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'grow query-value';
  valueInput.placeholder = 'Value';
  valueInput.value = value;
  valueInput.addEventListener('input', () => {
    if (onChange) onChange();
  });
  valueLabel.appendChild(valueInput);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-xs btn-ghost text-error';
  deleteBtn.textContent = '×';
  deleteBtn.addEventListener('click', () => {
    container.remove();
    if (onChange) onChange();
  });

  container.appendChild(keyLabel);
  container.appendChild(valueLabel);
  container.appendChild(deleteBtn);

  return container;
}

/**
 * Reads all query parameter key/value pairs from the DOM.
 *
 * @param container - The container element (e.g., #query-params-body)
 * @returns Array of { key, value } pairs
 */
export function getQueryParamsFromDOM(
  container: HTMLElement,
): Array<{ key: string; value: string }> {
  const rows = container.children;
  const params: Array<{ key: string; value: string }> = [];
  Array.from(rows).forEach((row) => {
    const keyInput = row.querySelector('.query-key') as HTMLInputElement | null;
    const valueInput = row.querySelector('.query-value') as HTMLInputElement | null;
    params.push({ key: keyInput?.value || '', value: valueInput?.value || '' });
  });
  return params;
}

/**
 * Checks if the last query param row in the container has both empty key and empty value.
 *
 * @param container - The container element
 * @returns True if last row is empty, false otherwise
 */
export function hasEmptyQueryParamAtEnd(container: HTMLElement): boolean {
  const params = getQueryParamsFromDOM(container);
  if (params.length === 0) return false;
  const last = params[params.length - 1];
  return last.key === '' && last.value === '';
}

/**
 * Adds a new empty query param row to the container, but only if the last row isn't already empty.
 *
 * @param container - The container element
 * @param onChange - Callback for the new row's input/delete handlers
 */
export function addQueryParamRow(container: HTMLElement, onChange?: () => void): void {
  if (hasEmptyQueryParamAtEnd(container)) return;
  const row = createQueryParamRow('', '', onChange);
  container.appendChild(row);
}

/**
 * Clears the container and populates it with rows for the given params.
 *
 * @param container - The container element
 * @param params - Array of { key, value } pairs to populate
 * @param onChange - Callback for each row's input/delete handlers
 */
export function populateQueryParamsTable(
  container: HTMLElement,
  params: Array<{ key: string; value: string }>,
  onChange?: () => void,
): void {
  container.innerHTML = '';
  params.forEach(({ key, value }) => {
    const row = createQueryParamRow(key, value, onChange);
    container.appendChild(row);
  });
}
