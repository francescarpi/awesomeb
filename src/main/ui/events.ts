import { UIWindow } from './window';
import log from 'electron-log';

const scopeLog = log.scope('UIWindowEvents');

export function registerWindowEvents(win: UIWindow) {
  //--------------------------------------------------------------------------------------
  win.on('focus', () => {
    scopeLog.info(`Window focused: ${win.id}`);
    win.eventsChannel.emit('ui:window-focused', win.id);
  });

  //--------------------------------------------------------------------------------------
  win.on('blur', () => {
    scopeLog.info(`Window blurred: ${win.id}`);
  });

  //--------------------------------------------------------------------------------------
  win.on('resize', () => {
    win.refreshLayout();
  });

  //--------------------------------------------------------------------------------------
  win.on('move', () => {
    win.refreshLayout();
  });
}
