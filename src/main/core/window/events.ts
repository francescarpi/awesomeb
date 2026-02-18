import { Window } from './window';
import log from 'electron-log';

const scopeLog = log.scope('WindowEvents');

export function registerWindowEvents(window: Window) {
  //--------------------------------------------------------------------------------------
  window.bw.on('focus', () => {
    scopeLog.info(`Window focused: ${window.id}`);
    window.browser.eventsChannel.emit('window:window-focus', window.id);
  });

  //--------------------------------------------------------------------------------------
  window.bw.on('blur', () => {
    if (window.modal) {
      return;
    }
    scopeLog.info(`Window blurred: ${window.id}`);
    window.browser.eventsChannel.emit('window:window-blur', window.id);
  });

  //--------------------------------------------------------------------------------------
  window.bw.on('resize', () => {
    window.refreshViewsBounds();
  });

  //--------------------------------------------------------------------------------------
  window.bw.on('move', () => {
    window.refreshViewsBounds();
  });

  //--------------------------------------------------------------------------------------
  window.bw.on('enter-html-full-screen', () => {
    window.setFullScreen(true);
  });

  //--------------------------------------------------------------------------------------
  window.bw.on('leave-html-full-screen', () => {
    window.setFullScreen(false);
  });
}
