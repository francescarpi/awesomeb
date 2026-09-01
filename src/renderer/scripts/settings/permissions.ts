import { h, Renderer, c, btnIcon, type VNode, radioBtn } from '#/scripts';
import { box } from './common';
import {
  type IConfig,
  type TPermission,
  type THost,
  type TPermissions,
  EPermissionConfigType,
} from '~/types';
import Delete from '#/icons/delete.svg?raw';

type Translations = Record<string, string>;

const KEYS = [
  'pages:settings.permissions.securityLevel.title',
  'pages:settings.permissions.securityLevel.desc',
  'pages:settings.permissions.securityLevel.standard',
  'pages:settings.permissions.securityLevel.strict',
  'pages:settings.permissions.list.title',
  'pages:settings.permissions.list.desc',
  'pages:settings.permissions.list.allow',
  'pages:settings.permissions.list.deny',
  'pages:settings.permissions.loading',
];

export async function renderPermissionsPage(config: IConfig): Promise<{
  renderer: Renderer;
  callback: () => void;
}> {
  const t = await abI18n.t(
    { winId: -1 },
    KEYS.map((key) => ({ key })),
  );
  const permissions = await abPermissions.get();
  const permissionsRenderer = new Renderer(
    h('ul', {}, h('li', {}, t['pages:settings.permissions.loading'])),
  );

  const renderer = new Renderer(
    h(
      'div',
      {},
      box(
        t['pages:settings.permissions.securityLevel.title'],
        t['pages:settings.permissions.securityLevel.desc'],
        h(
          'div',
          {},
          h(
            'select',
            {
              class: c('select', 'select-sm', 'w-40'),
              onchange: (e) => updateSecurityLevel(e, config),
            },
            h(
              'option',
              { selected: config.permissionsType === 'standard', value: 'standard' },
              t['pages:settings.permissions.securityLevel.standard'],
            ),
            h(
              'option',
              { selected: config.permissionsType === 'strict', value: 'strict' },
              t['pages:settings.permissions.securityLevel.strict'],
            ),
          ),
        ),
      ),
      box(
        t['pages:settings.permissions.list.title'],
        t['pages:settings.permissions.list.desc'],
        h('div', { id: 'permissions-list', class: c('text-sm') }),
      ),
    ),
  );

  const callback = () => {
    permissionsRenderer.render('permissions-list');
    updatePermissionsList(permissionsRenderer, permissions, t);
  };

  return { renderer, callback };
}

function sortedPermissions(permissions: Record<TPermission, boolean>): [TPermission, boolean][] {
  return Object.entries(permissions).sort(([permA], [permB]) => permA.localeCompare(permB)) as [
    TPermission,
    boolean,
  ][];
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

function renderPermissionsList(
  permissions: TPermissions,
  renderer: Renderer,
  t: Translations,
): VNode {
  const sortedKeys = Object.keys(permissions).sort();
  return h(
    'ul',
    {},
    ...sortedKeys.map((key) =>
      h(
        'li',
        { class: c('mb-4') },
        h('strong', { class: c('text-base-content') }, key),
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
                btnIcon(Delete, {
                  onClick: () => deletePermission(key, perm, permissions, renderer, t),
                  doubleConfirmation: true,
                  classNames: ['w-4'],
                }),
                h('span', {}, perm),
                h(
                  'div',
                  { class: c('ml-4', 'flex', 'gap-2', 'items-center') },
                  radioBtn(
                    `${key}-${perm}`,
                    `${key}-${perm}-allow`,
                    t['pages:settings.permissions.list.allow'],
                    value,
                    savePermission.bind(null, key, perm, true, permissions),
                  ),
                  radioBtn(
                    `${key}-${perm}`,
                    `${key}-${perm}-deny`,
                    t['pages:settings.permissions.list.deny'],
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
  );
}

function updatePermissionsList(renderer: Renderer, permissions: TPermissions, t: Translations) {
  renderer.update(renderPermissionsList(permissions, renderer, t));
}

async function deletePermission(
  host: THost,
  perm: TPermission,
  permissions: TPermissions,
  renderer: Renderer,
  t: Translations,
) {
  if (!permissions[host]) return;

  const { [perm]: _, ...remainingPerms } = permissions[host];

  if (Object.keys(remainingPerms).length === 0) {
    delete permissions[host];
  } else {
    permissions[host] = remainingPerms;
  }

  await abPermissions.save(permissions);
  updatePermissionsList(renderer, permissions, t);
}

async function updateSecurityLevel(e: Event, config: IConfig) {
  const permissionsType = (e.target as HTMLSelectElement).value as EPermissionConfigType;
  const newConfig = { ...config, permissionsType };
  await abConfig.save(newConfig);
}
