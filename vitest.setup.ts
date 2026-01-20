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
    contentView = {
      addChildView: () => {},
    };
    getBounds() {
      return { x: 0, y: 0, width: 800, height: 600 };
    }
    on() {}
    once() {}
    getContentSize() {
      return [800, 600];
    }
    hide() {}
    close() {}
  },
  WebContentsView: class {
    webContents = {
      loadFile: () => {},
      loadURL: () => {},
    };
    setBounds() {}
    getBounds() {
      return { x: 0, y: 0, width: 400, height: 400 };
    }
    setBorderRadius() {}
    setVisible() {}
    getVisible() {
      return true;
    }
  },
}));
