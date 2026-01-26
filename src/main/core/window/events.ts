import { Window } from './window';
import log from 'electron-log';

const scopeLog = log.scope('WindowEvents');

export function registerWindowEvents(window: Window) {
  //--------------------------------------------------------------------------------------
  window.bw.on('focus', () => {
    scopeLog.info(`Window focused: ${window.id}`);
    window.eventsChannel.emit('window:window-focus', window.id);
  });

  //--------------------------------------------------------------------------------------
  window.bw.on('blur', () => {
    scopeLog.info(`Window blurred: ${window.id}`);
    window.eventsChannel.emit('window:window-blur', window.id);
  });
}
