import type { VNode } from './types';
import type { TWindowId } from '~/types';
import { h } from './vdom';
import enter from '#/icons/return.svg?raw';
import esc from '#/icons/escape.svg?raw';

export interface IConfirmButtons {
  vnode: VNode[];
  registerEvents: () => () => void;
  setLoading: (value: boolean) => void;
  setConfirmEnabled: (value: boolean) => void;
  setCancelEnabled: (value: boolean) => void;
}

export async function confirmButtons({
  winId,
  confirmText,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  cancelDisabled = false,
}: {
  winId: TWindowId;
  confirmText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
}): Promise<IConfirmButtons> {
  const t = await abI18n.t({ winId }, [{ key: 'ok' }, { key: 'cancel' }]);
  const confText = confirmText || t['ok'];
  const cancelText = t['cancel'];

  let confirmEnabled = !confirmDisabled;
  let cancelEnabled = !cancelDisabled;
  let loading = false;

  const confirmIsEnabled = () => confirmEnabled && !loading;
  const cancelIsEnabled = () => cancelEnabled;

  const findButton = (id: 'confirm' | 'cancel'): HTMLButtonElement | null =>
    document.querySelector<HTMLButtonElement>(`button#${id}`);

  const applyConfirmState = () => {
    const btn = findButton('confirm');
    if (btn) btn.disabled = !confirmIsEnabled();
  };

  const applyCancelState = () => {
    const btn = findButton('cancel');
    if (btn) btn.disabled = !cancelIsEnabled();
  };

  const applyLoadingState = () => {
    const btn = findButton('confirm');
    if (!btn) return;
    const spinner = btn.querySelector('span.loading');
    if (spinner) spinner.classList.toggle('hidden', !loading);
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (confirmIsEnabled()) onConfirm();
    } else if (e.key === 'Escape') {
      if (onCancel) {
        if (cancelIsEnabled()) onCancel();
      } else if (confirmIsEnabled()) {
        onConfirm();
      }
    }
  };

  let unregister: (() => void) | null = null;

  const registerEvents = () => {
    if (unregister) unregister();
    window.addEventListener('keydown', onKeydown);
    unregister = () => {
      window.removeEventListener('keydown', onKeydown);
      unregister = null;
    };
    return unregister;
  };

  const cancel = h(
    'button',
    { class: 'btn btn-sm', onclick: onCancel, disabled: cancelDisabled, id: 'cancel' },
    h(
      'div',
      { class: 'flex gap-1 items-center' },
      cancelText,
      h('div', {
        class: 'icon [&>svg]:w-full [&>svg]:h-full w-4 h-4',
        innerHTML: esc,
      }),
    ),
  );

  const ok = h(
    'button',
    {
      class: 'btn btn-sm btn-primary',
      onclick: onConfirm,
      disabled: confirmDisabled,
      id: 'confirm',
    },
    h(
      'div',
      { class: 'flex gap-1 items-center' },
      h('span', { class: 'loading loading-xs hidden' }, ''),
      confText,
      h('div', {
        class: 'icon [&>svg]:w-full [&>svg]:h-full w-4 h-4',
        innerHTML: enter,
      }),
    ),
  );

  const vnode = onCancel ? [cancel, ok] : [ok];

  const setLoading = (value: boolean) => {
    loading = value;
    applyLoadingState();
    applyConfirmState();
  };

  const setConfirmEnabled = (value: boolean) => {
    confirmEnabled = value;
    applyConfirmState();
  };

  const setCancelEnabled = (value: boolean) => {
    cancelEnabled = value;
    applyCancelState();
  };

  return { vnode, registerEvents, setLoading, setConfirmEnabled, setCancelEnabled };
}
