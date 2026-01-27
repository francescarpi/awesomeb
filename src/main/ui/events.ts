import { UIWindow } from './window';

export function registerUIWindowEvents(win: UIWindow) {
  //--------------------------------------------------------------------------------------
  win.bw.on('resize', () => {
    win.render();
  });

  //--------------------------------------------------------------------------------------
  win.bw.on('move', () => {
    win.render();
  });
}
