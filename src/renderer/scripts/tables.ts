export function createTableRow(id: string): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.id = id;
  return row;
}

export function addRowCell(row: HTMLTableRowElement, text: string | HTMLElement, width?: number) {
  const cell = document.createElement('td');

  if (width) {
    cell.style.width = `${width}px`;
  }

  if (typeof text === 'string') {
    cell.textContent = text;
  } else {
    cell.appendChild(text);
  }
  row.appendChild(cell);
}
