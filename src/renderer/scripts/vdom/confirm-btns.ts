import type { VNode } from './types';
import { h } from './vdom';
import { c } from './classnames';
import { t } from '#/scripts/i18n';
import enter from '#/icons/return.svg?raw';
import esc from '#/icons/escape.svg?raw';

export function confirmButtons({
  confirmText,
  onConfirm,
  onCancel,
}: {
  confirmText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}): [VNode[], () => void] {
  const okLabel = confirmText ?? t('common.ok');
  const cancelLabel = t('common.cancel');

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
      cancelLabel,
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
      okLabel,
      h('div', {
        class: c('icon', '[&>svg]:w-full', '[&>svg]:h-full', 'w-4', 'h-4'),
        innerHTML: enter,
      }),
    ),
  );

  const btns = onCancel ? [cancel, ok] : [ok];

  return [btns, registerEvents];
}
