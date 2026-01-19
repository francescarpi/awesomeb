import { vi } from 'vitest';

import log from 'electron-log';

log.transports.file.level = false;
log.transports.console.level = false;

vi.mock('electron', () => ({
  app: {
    name: 'TestApp',
    isPackaged: false,
  },
  BrowserWindow: class {
    constructor() {}
    loadFile() {}
    loadURL() {}
    get webContents() {
      return {
        openDevTools: () => {},
        id: 1,
      };
    }
    get id() {
      return 1;
    }
  },
}));
