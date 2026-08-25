import type { TWindowId } from '~/types';

export interface IOption {
  value: string;
  label: string;
}

export async function dialogWithSelect(
  winId: TWindowId,
  message: string,
  options: IOption[],
  props?: {
    onAccept?: (optionId: string) => void;
  },
) {
  const t = await abI18n.t(winId, [{ key: 'ok' }, { key: 'cancel' }]);

  const dialog = document.createElement('dialog');
  dialog.classList.add('modal');

  const modalBox = document.createElement('div');
  modalBox.classList.add('modal-box');

  const messageEl = document.createElement('p');
  messageEl.classList.add('pb-4');
  messageEl.textContent = message;

  const select = document.createElement('select');
  select.classList.add('select', 'select-sm', 'w-full', 'mb-4');

  const optionsHtml = options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join('');

  select.innerHTML = optionsHtml;

  const actions = document.createElement('div');
  actions.classList.add('modal-actions');

  const actionsForm = document.createElement('form');
  actionsForm.method = 'dialog';
  actionsForm.classList.add('flex', 'justify-end', 'gap-2');

  const acceptButton = document.createElement('button');
  acceptButton.classList.add('btn', 'btn-sm', 'btn-primary');
  acceptButton.textContent = t['ok'];
  acceptButton.value = 'ok';

  const cancelButton = document.createElement('button');
  cancelButton.classList.add('btn', 'btn-sm');
  cancelButton.textContent = t['cancel'];
  cancelButton.value = 'cancel';

  actionsForm.appendChild(cancelButton);
  actionsForm.appendChild(acceptButton);
  actions.appendChild(actionsForm);

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
