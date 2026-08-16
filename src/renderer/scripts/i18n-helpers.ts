import { t } from './i18n';

export function setText(id: string, key: string, options?: Record<string, unknown>): void {
  const el = document.getElementById(id);
  if (el) el.textContent = t(key, options);
}

export function setInnerHTML(id: string, key: string, options?: Record<string, unknown>): void {
  const el = document.getElementById(id);
  if (el) el.innerHTML = t(key, options);
}

export function setPlaceholder(listId: string, key: string): void {
  const el = document.getElementById(listId);
  const input = el?.querySelector('input') as HTMLInputElement | null;
  if (input) input.placeholder = t(key);
}

export function setListEmptyText(): void {
  const els = document.querySelectorAll<HTMLElement>('.ab-list-empty');
  const txt = t('pages.listEmpty');
  els.forEach((el) => {
    el.textContent = txt;
  });
}
