import { h, type VNode } from '#/scripts';

export function box(title: string, desc: string, ...content: VNode[]): VNode {
  return h(
    'div',
    {
      class: 'border rounded-[var(--radius-box)] p-2 relative mb-6 w-full',
    },
    h(
      'span',
      {
        class: 'text-base-content',
      },
      title,
    ),
    h('p', { class: 'text-sm text-base-content text-sm mt-2 mb-4', innerHTML: desc }, ''),
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
        class: 'w-full rounded px-4 text-center h-[30px]',
        value: color,
      },
      '',
    ),
  );
}
