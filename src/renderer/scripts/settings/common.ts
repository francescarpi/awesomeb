import { h, type VNode, cls } from '#/scripts';

export function box(title: string, desc: string, ...content: VNode[]): VNode {
  return h(
    'div',
    { class: cls('border', 'rounded', 'p-2', 'border-white/40', 'relative') },
    h(
      'span',
      { class: cls('text-xs', 'bg-gray-900', 'absolute', '-top-[9px]', 'left-2', 'px-2') },
      title,
    ),
    h('p', { class: cls('text-sm', 'text-white/80', 'text-sm', 'mb-4') }, desc),
    ...content,
  );
}
