import { UIWindow } from './window';
import log from 'electron-log';

const scopeLog = log.scope('UIWindowEvents');

export function registerWindowEvents(win: UIWindow) {
  //--------------------------------------------------------------------------------------
  win.bw.on('focus', () => {
    scopeLog.info(`Window focused: ${win.id}`);
    win.eventsChannel.emit('ui:window-focused', win.id);
  });

  //--------------------------------------------------------------------------------------
  win.bw.on('blur', () => {
    scopeLog.info(`Window blurred: ${win.id}`);
  });

  //--------------------------------------------------------------------------------------
  win.bw.on('resize', () => {
    win.refreshLayout();
  });

  //--------------------------------------------------------------------------------------
  win.bw.on('move', () => {
    win.refreshLayout();
  });
}
