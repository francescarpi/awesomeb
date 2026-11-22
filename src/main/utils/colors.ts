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

export function contrastingTextColor(background: string): string {
  const { r, g, b } = hexToRgba(background);

  const channel = (value: number): number => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  return luminance > 0.179 ? '#000000' : '#ffffff';
}
