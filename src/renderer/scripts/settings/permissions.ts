import { h, Renderer, c, btnIcon, type VNode } from '#/scripts';
import { box } from './common';
import type { IConfig, TPermission, THost, TPermissions } from '~/types';
import Delete from '#/icons/delete.svg?raw';

export async function renderPermissionsPage(_config: IConfig): Promise<{
  renderer: Renderer;
  callback: () => void;
}> {
  const permissions = await abPermissions.get();
  const sortedKeys = Object.keys(permissions).sort();

  const renderer = new Renderer(
    h(
      'div',
      {},
      box(
        'Permissions',
        'Manage the permissions required for the extension to function properly.',
        h(
          'ul',
          {},
          ...sortedKeys.map((key) =>
            h(
              'li',
              { class: c('mb-4') },
              h('strong', { class: c('text-primary') }, key),
              h(
                'ul',
                { class: c('ml-4') },
                ...sortedPermissions(permissions[key]).map(([perm, value]) =>
                  h(
                    'li',
                    { class: c('mb-2') },
                    h(
                      'div',
                      { class: c('flex', 'gap-2', 'items-center') },
                      btnIcon(Delete, { onClick: () => {} }),
                      h('span', {}, perm),
                      h(
                        'div',
                        { class: c('ml-4', 'flex', 'gap-2', 'items-center') },
                        ...checkBox(
                          `${key}-${perm}`,
                          `${key}-${perm}-allow`,
                          'Allow',
                          value,
                          savePermission.bind(null, key, perm, true, permissions),
                        ),
                        ...checkBox(
                          `${key}-${perm}`,
                          `${key}-${perm}-deny`,
                          'Deny',
                          !value,
                          savePermission.bind(null, key, perm, false, permissions),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  const callback = () => {};

  return { renderer, callback };
}

function sortedPermissions(permissions: Record<TPermission, boolean>): [TPermission, boolean][] {
  return Object.entries(permissions).sort(([permA], [permB]) => permA.localeCompare(permB)) as [
    TPermission,
    boolean,
  ][];
}

function checkBox(
  name: string,
  id: string,
  label: string,
  checked: boolean,
  onChange: () => void,
): VNode[] {
  return [
    h(
      'input',
      {
        type: 'radio',
        class: c('radio', 'radio-xs'),
        checked: checked,
        name,
        id,
        onChange,
      },
      '',
    ),
    h(
      'label',
      {
        class: c('ml-1', 'cursor-pointer', 'select-none'),
        for: id,
      },
      label,
    ),
  ];
}

async function savePermission(
  host: THost,
  perm: TPermission,
  newVal: boolean,
  permissions: TPermissions,
) {
  const newPermissions = { ...permissions };
  if (!newPermissions[host]) {
    return;
  }
  newPermissions[host][perm] = newVal;
  await abPermissions.save(newPermissions);
}
