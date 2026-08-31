import { type IBookmark, EBookmarkType } from '~/types';

export async function editBookmark(
  bookmark: IBookmark,
  handleAccept: (result: { title: string; url?: string }) => void,
) {
  const t = await abI18n.t(-1, [
    { key: 'ok' },
    { key: 'cancel' },
    { key: 'pages:bookmarks.edit.title' },
    { key: 'pages:bookmarks.edit.inputTitlePlaceholder' },
    { key: 'pages:bookmarks.edit.inputTitleURL' },
  ]);

  const dialog = Object.assign(document.createElement('dialog'), { className: 'modal' });
  const modalBox = Object.assign(document.createElement('div'), {
    className: 'modal-box flex flex-col gap-2',
  });
  const messageEl = Object.assign(document.createElement('p'), {
    className: 'pb-4',
    textContent: t['pages:bookmarks.edit.title'],
  });

  const titleInput = Object.assign(document.createElement('input'), {
    className: 'input input-sm w-full',
    placeholder: t['pages:bookmarks.edit.inputTitlePlaceholder'],
    value: bookmark.title,
    onkeydown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        dialog.close('ok');
      }
    },
  });

  modalBox.appendChild(messageEl);
  modalBox.appendChild(titleInput);

  let urlInput: HTMLInputElement | undefined = undefined;
  if (bookmark.type === EBookmarkType.Url) {
    urlInput = Object.assign(document.createElement('input'), {
      className: 'input input-sm w-full',
      placeholder: t['pages:bookmarks.edit.inputTitleURL'],
      value: bookmark.url,
      onkeydown: (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          dialog.close('ok');
        }
      },
    });
    modalBox.appendChild(urlInput);
  }

  const btnsContainer = Object.assign(document.createElement('div'), {
    className: 'flex gap-2 mt-2 justify-end',
  });

  const btnCancel = Object.assign(document.createElement('button'), {
    className: 'btn btn-sm',
    textContent: t['cancel'],
    value: 'cancel',
    onclick: () => dialog.close(),
  });

  const btnOk = Object.assign(document.createElement('button'), {
    className: 'btn btn-sm btn-primary',
    textContent: t['ok'],
    value: 'ok',
    onclick: () => dialog.close('ok'),
  });

  btnsContainer.appendChild(btnCancel);
  btnsContainer.appendChild(btnOk);
  modalBox.appendChild(btnsContainer);

  dialog.appendChild(modalBox);
  document.body.appendChild(dialog);

  dialog.showModal();

  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'ok') {
      handleAccept({
        title: titleInput.value,
        url: urlInput?.value,
      });
    }
  });
}
