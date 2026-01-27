import { UIWindow } from './window';

export function registerUIWindowEvents(win: UIWindow) {
  //--------------------------------------------------------------------------------------
  win.bw.on('resize', () => {
    win.refreshLayoutDeprecated();
  });

  //--------------------------------------------------------------------------------------
  win.bw.on('move', () => {
    win.refreshLayoutDeprecated();
  });
}
