export function createIcon(icon: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = icon;
  img.classList.add('w-4', 'h-4');
  return img;
}
