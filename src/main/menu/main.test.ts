import { Menu } from 'electron';
import i18next from 'i18next';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { Browser, partitions } from '@/core';
import { mainMenu } from './main';
import { initI18n } from '~/i18n';

type TemplateItem = {
  label?: string;
  submenu?: TemplateItem[];
  accelerator?: string | undefined;
  enabled?: boolean;
  role?: string;
};

function findLabel(items: TemplateItem[] | undefined, label: string): TemplateItem | undefined {
  return items?.find((item) => item.label === label);
}

function hasMatchingLabel(items: TemplateItem[] | undefined, pattern: RegExp): boolean {
  return items?.some((item) => item.label !== undefined && pattern.test(item.label)) ?? false;
}

function findAppMenu(template: TemplateItem[]): TemplateItem | undefined {
  return template.find((item) => item.role === 'appMenu');
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

describe('appMenu check for updates', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  test('renders the check for updates item in every locale', async () => {
    const expected: Record<string, string> = {
      en: 'Check for Updates',
      es: 'Buscar actualizaciones',
      ca: 'Comprova si hi ha actualitzacions',
    };

    for (const [lng, label] of Object.entries(expected)) {
      await i18next.changeLanguage(lng);
      const template = await buildTemplate();

      const appMenu = findAppMenu(template);
      expect(appMenu, `app menu should exist for "${lng}"`).toBeDefined();
      expect(
        findLabel(appMenu!.submenu, label),
        `missing app menu item "${label}" for "${lng}"`,
      ).toBeDefined();
    }
  });

  test('disables the item while an update check is in progress', async () => {
    await i18next.changeLanguage('en');

    const template = await buildTemplate();
    const appMenu = findAppMenu(template);
    const item = findLabel(appMenu!.submenu, 'Check for Updates');
    expect(item, 'check for updates item should exist').toBeDefined();
    expect(item!.enabled, 'item should be enabled when no check is running').toBe(true);

    vi.spyOn(browser.appUpdater, 'isChecking', 'get').mockReturnValue(true);

    const checkingTemplate = await buildTemplate();
    const checkingAppMenu = findAppMenu(checkingTemplate);
    const checkingItem = findLabel(checkingAppMenu!.submenu, 'Check for Updates');
    expect(checkingItem, 'check for updates item should exist').toBeDefined();
    expect(checkingItem!.enabled, 'item should be disabled while checking').toBe(false);
  });
});
