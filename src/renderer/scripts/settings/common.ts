import { h, type VNode, c } from '#/scripts';

export function box(title: string, desc: string, ...content: VNode[]): VNode {
  return h(
    'div',
    { class: c('border', 'rounded-[var(--radius-box)]', 'p-2', 'relative', 'mb-6', 'w-full') },
    h(
      'span',
      {
        class: c('text-base-content'),
      },
      title,
    ),
    h(
      'p',
      { class: c('text-sm', 'text-base-content', 'text-sm', 'mt-2', 'mb-4'), innerHTML: desc },
      '',
    ),
    ...content,
  );
}

export function inputColorPicker(color: string): VNode {
  return h(
    'div',
    { class: 'color-picker' },
    h(
      'input',
      {
        'data-function': 'color-picker',
        'data-format': 'hex',
        class: c('w-full', 'rounded', 'px-4', 'text-center', 'h-[30px]'),
        value: color,
      },
      '',
    ),
  );
}
