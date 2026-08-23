import { Browser } from '@/core';
import { createHandler, windowChecker, modalChecker } from '@/utils';
import { t } from '~/i18n';

export function setupI18nIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ key: string }>(
    'i18n:t',
    'handle',
    browser,
    [windowChecker, [modalChecker]],
    async ({ key }) => {
      return t(key);
    },
  );
}
