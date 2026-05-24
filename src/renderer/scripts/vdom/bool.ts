import type { VNode } from './types';
import { h } from './vdom';
import { c } from './classnames';
import True from '#/icons/true.svg?raw';
import False from '#/icons/false.svg?raw';

export function bool(value: boolean, opts?: { colorized?: boolean }): VNode {
  const colorized = opts?.colorized || false;
  return h('div', {
    innerHTML: value ? True : False,
    class: c(colorized ? (value ? 'text-success' : 'text-error') : '', 'h-5'),
  });
}
