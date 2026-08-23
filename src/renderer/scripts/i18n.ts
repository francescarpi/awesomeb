import { getSearchParams } from './url';

export async function t(selector: string) {
  const { winId } = getSearchParams();
  const element = document.querySelector<HTMLElement>(selector);
  const tkey = element?.dataset.tkey;
  if (tkey) {
    element.textContent = await abI18n.t(winId, tkey);
  }
}
