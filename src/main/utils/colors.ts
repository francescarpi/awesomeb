import { nativeImage } from 'electron';

export function createColorImage(color = '#000000', size = 10) {
  const rgba = hexToRgba(color);
  const buffer = Buffer.alloc(size * size * 4);

  for (let i = 0; i < size * size; i++) {
    buffer[i * 4 + 0] = rgba.b; // B
    buffer[i * 4 + 1] = rgba.g; // G
    buffer[i * 4 + 2] = rgba.r; // R
    buffer[i * 4 + 3] = rgba.a; // A
  }

  return nativeImage.createFromBuffer(buffer, {
    width: size,
    height: size,
  });
}

function hexToRgba(hex: string) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 255,
  };
}
