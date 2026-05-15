import { Browser } from '@/core';
import { createHandler, internalPageChecker } from '@/utils';
import { SHORTCUTS_MAPS } from './index';

export function setupShortcutsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'shortcuts:maps',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({}) => {
      return SHORTCUTS_MAPS;
    },
  );
}
