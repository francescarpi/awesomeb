import fs from 'node:fs/promises';
import path from 'node:path';

export async function getMenuItems(
  lang: string | undefined,
  node: string | undefined,
): Promise<string[]> {
  if (!node || typeof node !== 'string') {
    return [];
  }

  const p = path.resolve(`../src/shared/i18n/locales/${lang || 'en'}/menu.json`);
  const f = await fs.readFile(p, 'utf-8');
  const d = JSON.parse(f);
  const r: string[] = [];

  const menuParts = node.split('.');
  if (menuParts.length !== 2) {
    return [];
  }

  const [firstK, secondK] = menuParts;

  const firstI = d[firstK];
  if (firstI.label) {
    r.push(firstI.label);
  }

  const secondI = firstI[secondK];
  if (secondI) {
    r.push(secondI);
  }

  return r;
}
