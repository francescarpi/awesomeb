export function createIcon(icon: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = icon;
  return img;
}
