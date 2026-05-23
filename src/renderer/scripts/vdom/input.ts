import type { VNode } from './types';
import { h } from './vdom';
import { c } from './classnames';

export function input(
  id: string,
  label: string,
  value: string,
  opts?: {
    width?: string;
    readonly?: boolean;
    visible?: boolean;
    autofocus?: boolean;
    select?: boolean;
    onInput?: (value: string) => void;
  },
): VNode {
  const visible = opts?.visible ?? true;
  const onInput = opts?.onInput
    ? (e: Event) => {
        opts.onInput!((e.target as HTMLInputElement).value);
      }
    : undefined;
  const onFocus = opts?.select
    ? (e: Event) => {
        (e.target as HTMLInputElement).select();
      }
    : undefined;
  return h(
    'label',
    { class: c('input', 'input-sm', opts?.width || 'w-full', !visible && 'hidden') },
    label,
    h(
      'input',
      { value, readonly: opts?.readonly, id, autofocus: opts?.autofocus, onInput, onFocus },
      '',
    ),
  );
}
