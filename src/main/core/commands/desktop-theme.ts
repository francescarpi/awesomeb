import { TDesktopId } from '~/types';
import { ICommand } from './types';
import log from 'electron-log';
import { getTheme } from '../themes';

const scopeLog = log.scope('ChangeDesktopThemeCommand');

export interface ICommandParams {
  desktopId: TDesktopId;
  themeName: string;
}

export const TRIGGER = 'desktop-theme';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'Desktop Theme',
  description: 'Change the theme of the selected desktop',
  modal: {
    page: 'desktop-theme',
    props: {
      height: 500,
    },
  },
  visibility: ({ window }) => !!window,
  async handler({ window, params }) {
    const desktop = window.getDesktop(params.desktopId);
    if (!desktop) {
      scopeLog.error(`Desktop with ID ${params.desktopId} not found`);
      return;
    }

    const theme = getTheme(params.themeName);
    if (!theme) {
      scopeLog.error(`Theme with name ${params.themeName} not found`);
      return;
    }

    desktop.setTheme(theme);
  },
};
