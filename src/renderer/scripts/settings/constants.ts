import { renderGeneralPage } from './general';
import { renderProfilesPage } from './profiles';
import { renderThemesPage } from './themes';
import { renderPermissionsPage } from './permissions';

export const settingsMenuItems = [
  { name: 'General', hash: ['#/', ''], renderFnc: renderGeneralPage },
  { name: 'Profiles', hash: ['#/profiles'], renderFnc: renderProfilesPage },
  { name: 'Themes', hash: ['#/themes'], renderFnc: renderThemesPage },
  { name: 'Permissions', hash: ['#/permissions'], renderFnc: renderPermissionsPage },
];
