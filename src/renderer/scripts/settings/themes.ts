import { h, Renderer } from '#/scripts';

export function renderThemesPage(): Renderer {
  return new Renderer(h('div', {}, 'Themes'));
}
