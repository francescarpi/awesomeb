import { renderGeneralPage } from './general';
import { renderProfilesPage } from './profiles';
import { renderThemesPage } from './themes';
import { renderPermissionsPage } from './permissions';
import { renderShortcutsPage } from './shortcuts';

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
];

export const RETENTION_OPTIONS = [1, 2, 3, 7, 15, 30, 60, 90];
