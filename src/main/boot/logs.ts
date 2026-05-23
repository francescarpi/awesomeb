import { app } from 'electron';
import log from 'electron-log';

export function setupLogs() {
  log.initialize();
  log.transports.ipc.level = false;

  if (app.isPackaged) {
    log.transports.file.level = false;
    log.transports.console.level = false;
  }
}
