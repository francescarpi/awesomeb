import { UIWindow } from './window';

export function registerUIWindowEvents(win: UIWindow) {
  //--------------------------------------------------------------------------------------
  win.bw.on('resize', () => {
    win.refreshLayout();
  });

  //--------------------------------------------------------------------------------------
  win.bw.on('move', () => {
    win.refreshLayout();
  });
}
