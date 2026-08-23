import { Menu } from 'electron';
import i18next from 'i18next';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { Browser, partitions } from '@/core';
import { mainMenu } from './main';
import { initI18n } from '~/i18n';

type TemplateItem = {
  label?: string;
  submenu?: TemplateItem[];
  accelerator?: string | undefined;
};

function findLabel(items: TemplateItem[] | undefined, label: string): TemplateItem | undefined {
  return items?.find((item) => item.label === label);
}

function hasMatchingLabel(items: TemplateItem[] | undefined, pattern: RegExp): boolean {
  return items?.some((item) => item.label !== undefined && pattern.test(item.label)) ?? false;
}

let browser: Browser;

beforeAll(initI18n);
afterAll(() => i18next.changeLanguage('en'));

beforeEach(() => {
  browser = new Browser();
  partitions.init();
  browser.createWindow(1, { withDesktops: true });
});

async function buildTemplate(): Promise<TemplateItem[]> {
  const captured: unknown[] = [];
  vi.spyOn(Menu, 'buildFromTemplate').mockImplementation((template) => {
    captured.push(template);
    return template as unknown as Menu;
  });
  await mainMenu(browser, false);
  return captured[captured.length - 1] as TemplateItem[];
}

describe('mainMenu translations', () => {
  test('renders the File menu in Spanish', async () => {
    await i18next.changeLanguage('es');
    const template = await buildTemplate();

    const file = findLabel(template, 'Archivo');
    expect(file, 'File menu should be translated').toBeDefined();

    const expected = [
      'Ejecutar comando',
      'Nueva ventana',
      'Nueva pestaña',
      'Pegar e ir',
      'Abrir pestaña cerrada recientemente',
    ];
    for (const label of expected) {
      expect(findLabel(file!.submenu, label), `missing File item "${label}"`).toBeDefined();
    }
  });

  test('interpolates desktop and tab entries in Spanish', async () => {
    await i18next.changeLanguage('es');
    const template = await buildTemplate();

    const desktops = findLabel(template, 'Escritorios');
    expect(desktops).toBeDefined();
    expect(findLabel(desktops!.submenu, 'Buscar escritorio')).toBeDefined();
    expect(findLabel(desktops!.submenu, 'Anterior')).toBeDefined();
    expect(findLabel(desktops!.submenu, 'Siguiente')).toBeDefined();
    expect(hasMatchingLabel(desktops!.submenu, /^Escritorio \d+$/)).toBe(true);

    const tabs = findLabel(template, 'Pestañas');
    expect(tabs).toBeDefined();
    expect(findLabel(tabs!.submenu, 'Buscar pestaña')).toBeDefined();
    expect(hasMatchingLabel(tabs!.submenu, /^Pestaña \d+$/)).toBe(true);
  });

  test('renders zoom actions in Spanish', async () => {
    await i18next.changeLanguage('es');
    const template = await buildTemplate();

    const tabs = findLabel(template, 'Pestañas');
    expect(findLabel(tabs!.submenu, 'Acercar')).toBeDefined();
    expect(findLabel(tabs!.submenu, 'Alejar')).toBeDefined();
    expect(findLabel(tabs!.submenu, 'Restablecer zoom')).toBeDefined();
  });

  test('renders the Bookmarks menu in Catalan', async () => {
    await i18next.changeLanguage('ca');
    const template = await buildTemplate();

    const bookmarks = findLabel(template, "Adreces d'interès");
    expect(bookmarks).toBeDefined();
    expect(findLabel(bookmarks!.submenu, "Gestiona les adreces d'interès")).toBeDefined();
    expect(findLabel(bookmarks!.submenu, "Obre una adreça d'interès")).toBeDefined();
  });

  test('keeps menu structure identical across locales', async () => {
    const topLevelCounts: number[] = [];
    const fileAccelerators: Array<Array<string | undefined>> = [];

    for (const lng of ['en', 'es', 'ca']) {
      await i18next.changeLanguage(lng);
      const template = await buildTemplate();
      topLevelCounts.push(template.length);

      const file = template.find((item) =>
        ['File', 'Archivo', 'Fitxer'].includes(item.label ?? ''),
      );
      fileAccelerators.push((file?.submenu ?? []).map((item) => item.accelerator));
    }

    expect(new Set(topLevelCounts).size).toBe(1);
    expect(fileAccelerators[0]).toEqual(fileAccelerators[1]);
    expect(fileAccelerators[0]).toEqual(fileAccelerators[2]);
  });
});
