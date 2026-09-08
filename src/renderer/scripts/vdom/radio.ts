import type { VNode } from './types';
import { h } from './vdom';

export function radioBtn(
  name: string,
  id: string,
  label: string,
  checked: boolean,
  onChange: (e: Event) => void,
  indicator?: string,
): VNode {
  const displayLabel = indicator ? `${label} ${indicator}` : label;
  return h(
    'div',
    { className: 'flex items-center' },
    h(
      'input',
      {
        type: 'radio',
        class: 'radio radio-xs -mt-1',
        checked: checked,
        name,
        id,
        onChange,
        onClick: onChange,
      },
      '',
    ),
    h(
      'label',
      {
        class: 'ml-1 cursor-pointer select-none text-sm',
        for: id,
      },
      displayLabel,
    ),
  );
}
