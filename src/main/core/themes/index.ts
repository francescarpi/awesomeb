import { Theme } from './theme';
export { Theme } from './theme';
import { config } from '@/core';

const themeBlue = new Theme('blue', '#2b7fff', '#1c398e', 238);
const themePurple = new Theme('purple', '#ad46ff', '#59168b', 338);
const themeEmerald = new Theme('emerald', '#00bc7d', '#004f3b', 8);
const themePink = new Theme('pink', '#f6339a', '#861043', 8);
const themeOrange = new Theme('orange', '#ff8c97', '#e9d97a', 8);
const themeBlack = new Theme('black', '#6B6B6B', '#2C2C2C', 347);

const defaultThemes: Map<string, Theme> = new Map([
  [themeBlue.name, themeBlue],
  [themePurple.name, themePurple],
  [themeEmerald.name, themeEmerald],
  [themePink.name, themePink],
  [themeOrange.name, themeOrange],
  [themeBlack.name, themeBlack],
]);

export function getThemes(): Map<string, Theme> {
  const themes = new Map<string, Theme>(defaultThemes);

  for (const configTheme of config.getProperty('themes')) {
    if (!themes.has(configTheme.name)) {
      const theme = new Theme(
        configTheme.name,
        configTheme.primary,
        configTheme.secondary,
        configTheme.degrees,
      );
      themes.set(configTheme.name, theme);
    }
  }

  return themes;
}

export const defaultTheme = themeBlue;

export function getTheme(name: string): Theme {
  return getThemes().get(name) || defaultTheme;
}
