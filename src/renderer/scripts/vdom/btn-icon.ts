import type { VNode } from './types';
import { h } from './vdom';
import { c } from './classnames';

export function btnIcon(
  icon: string,
  props?: {
    onClick?: () => void;
    classNames?: string[];
    doubleConfirmation?: boolean;
    size?: number;
  },
): VNode {
  const { onClick, classNames, doubleConfirmation, size } = props || { size: 5.5 };
  let numClicks = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return h(
    'div',
    {
      class: c(
        'text-base-content',
        'hover:bg-white/30',
        'cursor-pointer',
        'rounded',
        'flex',
        'items-center',
        'justify-center',
        '[&>svg]:w-full',
        '[&>svg]:h-full',
        `w-${size}`,
        `h-${size}`,
        ...(classNames || []),
      ),
      innerHTML: icon,
      onClick: (e: Event) => {
        e.stopPropagation();
        if (doubleConfirmation) {
          if (numClicks === 0) {
            (e.target as SVGElement).classList.add('text-error');
            numClicks += 1;
            timeout = setTimeout(() => {
              numClicks = 0;
              timeout = null;
              (e.target as SVGElement).classList.remove('text-error');
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
