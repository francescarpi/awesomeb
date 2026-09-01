import type { VNode } from './types';
import { h } from './vdom';
import { c } from './classnames';

export function icon(icon: string, color: string, size: string = '3.5'): VNode {
  return h(
    'div',
    {
      class: c(`w-${size}`, `h-{size}`, color, '[&>svg]:w-full', '[&>svg]:h-full'),
      innerHTML: icon,
    },
    '',
  );
}
