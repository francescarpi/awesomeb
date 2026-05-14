import { h, Renderer } from '#/scripts';

export function renderThemesPage(): { renderer: Renderer; callback: () => void } {
  const renderer = new Renderer(h('div', {}, 'Themes'));

  const callback = () => {
    console.log('Themes page rendered');
  };

  return { renderer, callback };
}
