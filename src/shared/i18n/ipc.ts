import { Browser } from '@/core';
import {
  createHandler,
  windowChecker,
  modalChecker,
  internalPageChecker,
  conditionalChecker,
} from '@/utils';
import { t } from '~/i18n';

export function setupI18nIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ keys: { key: string; params?: Record<string, unknown> }[] }>(
    'i18n:t',
    'handle',
    browser,
    [
      conditionalChecker.bind(
        null,
        (args) => typeof args.winId === 'number',
        [windowChecker, modalChecker],
        [internalPageChecker.bind(null, 'bookmarks'), internalPageChecker.bind(null, 'downloads')],
      ),
    ],
    async ({ keys }) => {
      return keys.reduce((acc, curr) => {
        acc[curr.key] = t(curr.key, curr.params);
        return acc;
      }, {});
    },
  );
}
