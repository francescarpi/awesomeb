import { IEntity, IDesktopEntity, IThemeEntity } from '~/types';
import { Browser, getCommands, getThemes, Window } from '@/core';

export class BrowserRenderer {
  constructor(private readonly _browser: Browser) {}

  commands(): IEntity[] {
    return getCommands(this._browser).map((cmd) => ({
      id: cmd.trigger,
      label: cmd.name,
      extra: cmd.description,
    }));
  }

  desktops(window: Window): IDesktopEntity[] {
    return window.desktops.map((desk) => ({
      id: desk.id.toString(),
      label: desk.label,
      selected: desk.id === window.selectedDesktop.id,
      requireAttention: desk.requireAttention,
      hasTabs: desk.hasTabs,
      hasActiveTabs: desk.hasActiveTabs,
      name: desk.name,
    }));
  }

  themes(window: Window): IThemeEntity[] {
    const themes = getThemes();

    const selectedDesktop = window.selectedDesktop;
    const result: IThemeEntity[] = [];

    for (const [name, theme] of themes.entries()) {
      result.push({
        id: name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        selected: selectedDesktop.theme?.name === name,
        primary: theme.primary,
        secondary: theme.secondary,
        degrees: theme.degrees,
      });
    }

    return result;
  }
}
