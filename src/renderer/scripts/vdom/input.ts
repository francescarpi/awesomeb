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
    onInput?: (value: string, target: HTMLInputElement) => void;
    type?: string;
    required?: boolean;
  },
): VNode {
  const visible = opts?.visible ?? true;
  const onInput = opts?.onInput
    ? (e: Event) => {
        opts.onInput!((e.target as HTMLInputElement).value, e.target as HTMLInputElement);
      }
    : undefined;
  const onFocus = opts?.select
    ? (e: Event) => {
        (e.target as HTMLInputElement).select();
      }
    : undefined;
  const required = opts?.required ? 'required' : undefined;

  return h(
    'label',
    {
      class: c(
        'input',
        'input-sm',
        opts?.width || 'w-full',
        !visible && 'hidden',
        'text-base-content/40',
      ),
    },
    label,
    h(
      'input',
      {
        value,
        readonly: opts?.readonly,
        id,
        autofocus: opts?.autofocus,
        onInput,
        onFocus,
        class: c('text-base-content'),
        type: opts?.type || 'text',
        required,
      },
      '',
    ),
  );
}
