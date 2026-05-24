import type { VNode } from './types';
import { h } from './vdom';
import { c } from './classnames';

export function radioBtn(
  name: string,
  id: string,
  label: string,
  checked: boolean,
  onChange: (e: Event) => void,
): VNode {
  return h(
    'div',
    { className: c('flex', 'items-center') },
    h(
      'input',
      {
        type: 'radio',
        class: c('radio', 'radio-xs', '-mt-1'),
        checked: checked,
        name,
        id,
        onChange,
      },
      '',
    ),
    h(
      'label',
      {
        class: c('ml-1', 'cursor-pointer', 'select-none', 'text-sm'),
        for: id,
      },
      label,
    ),
  );
}
