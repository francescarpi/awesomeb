import { Browser, permissions, notification } from '@/core';
import { createHandler, internalPageChecker } from '@/utils';
import type { TPermissions } from '~/types';

export function setupPermissionsIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{}>(
    'permissions:get',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({}) => {
      return permissions.all;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ permissions: TPermissions }>(
    'permissions:save',
    'handle',
    browser,
    [internalPageChecker.bind(null, 'settings')],
    async ({ permissions: perms }) => {
      permissions.saveAll(perms);
      notification('Permission saved', 'Your permission have been saved successfully.');
    },
  );
}
