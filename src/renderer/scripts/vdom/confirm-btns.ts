import type { VNode } from './types';
import type { TWindowId } from '~/types';
import { h } from './vdom';
import { c } from './classnames';
import enter from '#/icons/return.svg?raw';
import esc from '#/icons/escape.svg?raw';

export async function confirmButtons({
  winId,
  confirmText,
  onConfirm,
  onCancel,
}: {
  winId: TWindowId;
  confirmText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}): Promise<[VNode[], () => void]> {
  const t = await abI18n.t(winId, [{ key: 'ok' }, { key: 'cancel' }]);
  const confText = confirmText || t['ok'];
  const cancelText = t['cancel'];

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm();
    } else if (e.key === 'Escape') {
      if (onCancel) {
        onCancel();
      } else {
        onConfirm();
      }
    }
  };

  const registerEvents = () => {
    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener('keydown', onKeydown);
    };
  };

  const cancel = h(
    'button',
    { class: c('btn', 'btn-sm'), onclick: onCancel },
    h(
      'div',
      { class: c('flex', 'gap-1', 'items-center') },
      cancelText,
      h('div', {
        class: c('icon', '[&>svg]:w-full', '[&>svg]:h-full', 'w-4', 'h-4'),
        innerHTML: esc,
      }),
    ),
  );

  const ok = h(
    'button',
    { class: c('btn', 'btn-sm', 'btn-primary'), onclick: onConfirm },
    h(
      'div',
      { class: c('flex', 'gap-1', 'items-center') },
      confText,
      h('div', {
        class: c('icon', '[&>svg]:w-full', '[&>svg]:h-full', 'w-4', 'h-4'),
        innerHTML: enter,
      }),
    ),
  );

  const btns = onCancel ? [cancel, ok] : [ok];

  return [btns, registerEvents];
}
