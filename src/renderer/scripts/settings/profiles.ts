import { h, Renderer } from '#/scripts';

export function renderProfilesPage(): Renderer {
  return new Renderer(h('div', {}, 'Profiles'));
}
