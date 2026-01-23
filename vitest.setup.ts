import { vi } from 'vitest';

import log from 'electron-log';

log.transports.file.level = false;
log.transports.console.level = false;

vi.mock('electron', () => {
  const webContents = {
    openDevTools: () => {},
    id: 1,
    loadFile: () => {},
    loadURL: () => {},
    send: () => {},
  };

  return {
    app: {
      name: 'TestApp',
      isPackaged: false,
    },
    BrowserWindow: class {
      constructor() {}
      loadFile() {}
      loadURL() {}
      get webContents() {
        return webContents;
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
      isVisible() {
        return true;
      }
      static getAllWindows() {
        return [];
      }
      static getFocusedWindow() {
        return null;
      }
    },
    WebContentsView: class {
      webContents = webContents;
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
    WebContents: class {
      loadFile() {}
      loadURL() {}
    },
  };
});
