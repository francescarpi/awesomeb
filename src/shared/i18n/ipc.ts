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
import { t } from '~/i18n';

export function setupI18nIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ keys: { key: string; params?: Record<string, unknown> }[] }>(
    'i18n:t',
    'handle',
    browser,
    [
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
    ],
    async ({ keys }) => {
      const result = keys.reduce((acc, curr) => {
        acc[curr.key] = t(curr.key, curr.params);
        return acc;
      }, {});
      return result;
    },
  );
}
