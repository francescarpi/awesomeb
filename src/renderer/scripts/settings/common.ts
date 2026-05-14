import { h, type VNode, c } from '#/scripts';

export function box(title: string, desc: string, ...content: VNode[]): VNode {
  return h(
    'div',
    { class: c('border', 'rounded', 'p-2', 'border-white/40', 'relative', 'mb-6') },
    h(
      'span',
      { class: c('text-xs', 'bg-gray-900', 'absolute', '-top-[9px]', 'left-2', 'px-2') },
      title,
    ),
    h('p', { class: c('text-sm', 'text-white/80', 'text-sm', 'mt-2', 'mb-4') }, desc),
    ...content,
  );
}

export function inputColorPicker(color: string, classNames?: string[]): VNode {
  return h(
    'div',
    { class: 'color-picker' },
    h(
      'input',
      {
        'data-function': 'color-picker',
        'data-format': 'hex',
        class: c(...(classNames || [])),
        value: color,
      },
      '',
    ),
  );
}
