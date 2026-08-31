export interface IOption {
  value: string;
  label: string;
}

export async function dialogWithSelect(
  message: string,
  options: IOption[],
  props?: {
    onAccept?: (optionId: string) => void;
  },
) {
  const t = await abI18n.t(-1, [{ key: 'ok' }, { key: 'cancel' }]);

  const dialog = Object.assign(document.createElement('dialog'), { className: 'modal' });
  const modalBox = Object.assign(document.createElement('div'), { className: 'modal-box' });
  const messageEl = Object.assign(document.createElement('p'), {
    className: 'pb-4',
    textContent: message,
  });

  const select = Object.assign(document.createElement('select'), {
    className: 'select select-sm w-full mb-4',
  });

  const optionsHtml = options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join('');

  select.innerHTML = optionsHtml;

  const actions = Object.assign(document.createElement('div'), {
    className: 'flex gap-2 mt-2 justify-end',
  });

  const cancel = Object.assign(document.createElement('button'), {
    className: 'btn btn-sm',
    textContent: t['cancel'],
    value: 'cancel',
    onclick: () => dialog.close(),
  });

  const ok = Object.assign(document.createElement('button'), {
    className: 'btn btn-sm btn-primary',
    textContent: t['ok'],
    value: 'ok',
    onclick: () => dialog.close('ok'),
  });

  actions.appendChild(cancel);
  actions.appendChild(ok);

  modalBox.appendChild(messageEl);
  modalBox.appendChild(select);
  modalBox.appendChild(actions);
  dialog.appendChild(modalBox);

  document.body.appendChild(dialog);

  dialog.showModal();

  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'ok' && props?.onAccept) {
      props.onAccept(select.value);
    }
  });
}
