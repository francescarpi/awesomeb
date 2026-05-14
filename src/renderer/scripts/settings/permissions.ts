import { h, Renderer } from '#/scripts';

export function renderPermissionsPage(): { renderer: Renderer; callback: () => void } {
  const renderer = new Renderer(h('div', {}, 'Permissions'));

  const callback = () => {
    console.log('Permissions page rendered');
  };

  return { renderer, callback };
}
