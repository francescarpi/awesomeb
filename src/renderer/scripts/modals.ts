import { getSearchParams } from './url';

export function closeModalOnEsc() {
  const { winId } = getSearchParams();
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      abModal.close(winId);
    }
  });
}
