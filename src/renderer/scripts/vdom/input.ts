import type { VNode } from './types';
import { h } from './vdom';
import { c } from './classnames';

export function input(
  id: string,
  label: string,
  value: string,
  opts?: {
    width?: string;
    readonly?: boolean;
  },
): VNode {
  return h(
    'label',
    { class: c('input', 'text-gray-400', opts?.width || 'w-full') },
    label,
    h('input', { class: c('grow', 'text-black'), value, readonly: opts?.readonly, id }, ''),
  );
}
