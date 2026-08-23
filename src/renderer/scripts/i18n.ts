import { getSearchParams } from './url';

export async function t(selector: string, prop: string) {
  const { winId } = getSearchParams();
  const element = document.querySelector<HTMLElement>(selector);
  const tkey = element?.dataset.tkey;
  if (tkey) {
    element[prop] = await abI18n.t(winId, tkey);
  }
}
