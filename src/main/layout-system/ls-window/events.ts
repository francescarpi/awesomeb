import { LSWindow } from './ls-window';

export function registerWindowEvents(bw: LSWindow) {
  bw.on('resize', async () => {
    if (bw.layout) {
      bw.layout.refreshBounds(bw.getBounds());
    }
  });
}
