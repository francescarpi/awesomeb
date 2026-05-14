import type { VNode } from './types';
import { h } from './vdom';
import { c } from './classnames';

export function btnIcon(
  icon: string,
  props?: { onClick?: () => void; classNames?: string[]; doubleConfirmation?: boolean },
): VNode {
  const { onClick, classNames, doubleConfirmation } = props || {};
  let numClicks = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

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
      onClick: (e: Event) => {
        if (doubleConfirmation) {
          if (numClicks === 0) {
            (e.target as SVGElement).classList.add('text-red-500');
            numClicks += 1;
            timeout = setTimeout(() => {
              numClicks = 0;
              timeout = null;
              (e.target as SVGElement).classList.remove('text-red-500');
            }, 3000);
          } else if (onClick) {
            if (timeout) clearTimeout(timeout);
            onClick();
          }
        } else if (onClick) {
          onClick();
        }
      },
    },
    '',
  );
}
