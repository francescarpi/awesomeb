import { getWinId } from './window';

export function closeModalOnEsc() {
  const winId = getWinId();
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      abModal.closeModal(winId);
    }
  });
}
