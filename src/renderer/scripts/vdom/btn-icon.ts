import type { VNode } from './types';
import { h } from './vdom';
import { c } from './classnames';

export function btnIcon(
  icon: string,
  props?: { onClick?: () => void; classNames?: string[] },
): VNode {
  const { onClick, classNames } = props || {};

  return h(
    'div',
    {
      class: c(
        'text-white',
        'hover:bg-white/30',
        'cursor-pointer',
        'rounded',
        'flex',
        'items-center',
        'justify-center',
        'w-5.5',
        'h-5.5',
        ...(classNames || []),
      ),
      innerHTML: icon,
      onClick,
    },
    '',
  );
}
