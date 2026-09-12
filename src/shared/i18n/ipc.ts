import { Browser } from '@/core';
import {
  createHandler,
  windowChecker,
  modalChecker,
  internalPageChecker,
  multiConditional,
  welcomeWindowChecker,
  tabChecker,
  findInPageChecker,
} from '@/utils';
import { currentLocale, getRendererBundle, t } from '~/i18n';

// Shared by every i18n channel: the bundle request must be as callable as the
// per-key translator, from the same views (internal pages, modals, tabs...).
const i18nCheckers = [
  multiConditional(
    [
      [
        (args) => typeof args.winId === 'number' && (args.winId as number) !== -1,
        [windowChecker, modalChecker],
      ],
      [(args) => typeof args.tabId === 'number', [tabChecker, findInPageChecker]],
    ],
    [
      internalPageChecker.bind(null, [
        'bookmarks',
        'downloads',
        'extensions',
        'settings',
        'urlbar',
        'debug',
        'history',
      ]),
      welcomeWindowChecker,
    ],
  ),
];

export function setupI18nIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ keys: { key: string; params?: Record<string, unknown> }[] }>(
    'i18n:t',
    'handle',
    browser,
    i18nCheckers,
    async ({ keys }) => {
      const result = keys.reduce((acc, curr) => {
        acc[curr.key] = t(curr.key, curr.params);
        return acc;
      }, {});
      return result;
    },
  );

  //--------------------------------------------------------------------------------------
  // Once-per-window transfer of the renderer's two namespaces (pages + common,
  // ~13 KB). The preload caches it and resolves keys locally, removing the
  // per-container IPC round trips for the sidebar/history and the unbounded
  // preload cache that never hit parametrized keys.
  createHandler<object>('i18n:get-bundle', 'handle', browser, i18nCheckers, async () =>
    getRendererBundle(currentLocale()),
  );
}
