import { Browser, config } from '@/core';
import { createHandler, internalPageChecker } from '@/utils';
import { IConfig } from '~/types';

export function setupConfigIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'config:get',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({}) => {
      return config.config;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ newConfig: IConfig }>(
    'config:save',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({ newConfig }) => {
      config.save(newConfig);
    },
  );
}
