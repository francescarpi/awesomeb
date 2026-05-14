import { h, Renderer, c, btnIcon, type VNode } from '#/scripts';
import { box } from './common';
import {
  type IConfig,
  type TPermission,
  type THost,
  type TPermissions,
  EPermissionConfigType,
} from '~/types';
import Delete from '#/icons/delete.svg?raw';

export async function renderPermissionsPage(config: IConfig): Promise<{
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
        'Security Level',
        "This setting determines the level of access granted to websites regarding your device's functionalities (sensors, APIs, etc.).<br/><br/><strong>Standard</strong>: Allows common permissions necessary for most web pages to function correctly.<br/><strong>Strict</strong>: Requires your explicit consent for every permission a website attempts to use, offering maximum privacy.",
        h(
          'div',
          { class: c('text-black') },
          h(
            'select',
            { class: c('select', 'w-40'), onchange: (e) => updateSecurityLevel(e, config) },
            h(
              'option',
              { selected: config.permissionsType === 'standard', value: 'standard' },
              'Standard',
            ),
            h(
              'option',
              { selected: config.permissionsType === 'strict', value: 'strict' },
              'Strict',
            ),
          ),
        ),
      ),
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

async function updateSecurityLevel(e: Event, config: IConfig) {
  const permissionsType = (e.target as HTMLSelectElement).value as EPermissionConfigType;
  const newConfig = { ...config, permissionsType };
  await abConfig.save(newConfig);
}
