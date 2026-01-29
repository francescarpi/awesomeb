import { UIWindow } from './window';

export function registerUIWindowEvents(win: UIWindow) {
  //--------------------------------------------------------------------------------------
  win.bw.on('resize', () => {
    win.renderLayout();
  });

  //--------------------------------------------------------------------------------------
  win.bw.on('move', () => {
    win.renderLayout();
  });
}
