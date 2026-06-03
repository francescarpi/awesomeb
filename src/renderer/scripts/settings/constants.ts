import { renderGeneralPage } from './general';
import { renderProfilesPage } from './profiles';
import { renderThemesPage } from './themes';
import { renderPermissionsPage } from './permissions';
import { renderShortcutsPage } from './shortcuts';

export const settingsMenuItems = [
  { name: 'General', hash: ['#/', ''], rendererFnc: renderGeneralPage },
  { name: 'Profiles', hash: ['#/profiles'], rendererFnc: renderProfilesPage },
  { name: 'Themes', hash: ['#/themes'], rendererFnc: renderThemesPage },
  { name: 'Permissions', hash: ['#/permissions'], rendererFnc: renderPermissionsPage },
  { name: 'Shortcuts', hash: ['#/shortcuts'], rendererFnc: renderShortcutsPage },
];

export const RETENTION_OPTIONS = [7, 15, 30, 60, 90];
