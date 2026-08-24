import type { TWindowId } from '~/types';

export async function dialogConfirm(
  winId: TWindowId,
  message: string,
  props?: {
    onAccept?: () => void;
  },
) {
  const dialog = document.createElement('dialog');
  dialog.classList.add('modal');

  const modalBox = document.createElement('div');
  modalBox.classList.add('modal-box');

  const messageEl = document.createElement('p');
  messageEl.classList.add('pb-4');
  messageEl.textContent = message;

  const actions = document.createElement('div');
  actions.classList.add('modal-actions');

  const actionsForm = document.createElement('form');
  actionsForm.method = 'dialog';
  actionsForm.classList.add('flex', 'justify-end', 'gap-2');

  const acceptButton = document.createElement('button');
  acceptButton.classList.add('btn', 'btn-sm', 'btn-primary');
  acceptButton.textContent = await abI18n.t(winId, 'ok');
  acceptButton.value = 'ok';

  const cancelButton = document.createElement('button');
  cancelButton.classList.add('btn', 'btn-sm');
  cancelButton.textContent = await abI18n.t(winId, 'cancel');
  cancelButton.value = 'cancel';

  actionsForm.appendChild(cancelButton);
  actionsForm.appendChild(acceptButton);
  actions.appendChild(actionsForm);

  modalBox.appendChild(messageEl);
  modalBox.appendChild(actions);
  dialog.appendChild(modalBox);
  document.body.appendChild(dialog);

  dialog.showModal();

  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'ok' && props?.onAccept) {
      props.onAccept();
    }
  });
}
