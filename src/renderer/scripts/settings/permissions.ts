import { h, Renderer } from '#/scripts';

export function renderPermissionsPage(): Renderer {
  return new Renderer(h('div', {}, 'Permissions'));
}
