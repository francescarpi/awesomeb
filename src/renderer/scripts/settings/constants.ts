import { renderGeneralPage } from './general';
import { renderProfilesPage } from './profiles';
import { renderThemesPage } from './themes';
import { renderPermissionsPage } from './permissions';
import { renderShortcutsPage } from './shortcuts';
import { renderTagsPage } from './tags';

export const settingsMenuItems = [
  { nameKey: 'pages:settings.menu.general', hash: ['#/', ''], rendererFnc: renderGeneralPage },
  {
    nameKey: 'pages:settings.menu.profiles',
    hash: ['#/profiles'],
    rendererFnc: renderProfilesPage,
  },
  { nameKey: 'pages:settings.menu.themes', hash: ['#/themes'], rendererFnc: renderThemesPage },
  {
    nameKey: 'pages:settings.menu.permissions',
    hash: ['#/permissions'],
    rendererFnc: renderPermissionsPage,
  },
  {
    nameKey: 'pages:settings.menu.shortcuts',
    hash: ['#/shortcuts'],
    rendererFnc: renderShortcutsPage,
  },
  { nameKey: 'pages:settings.menu.tags', hash: ['#/tags'], rendererFnc: renderTagsPage },
];

export const RETENTION_OPTIONS = [1, 2, 3, 7, 15, 30, 60, 90];
