export function onClick(id: string, callback: () => void) {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', callback);
  }
}
