import { vi } from 'vitest';

// Mock electron-log first to avoid import issues
vi.mock('electron-log', () => ({
  default: {
    scope: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    transports: {
      file: { level: false },
      console: { level: false },
    },
  },
}));

vi.mock('electron', () => {
  const webContents = {
    openDevTools: vi.fn(),
    id: 1,
    loadFile: vi.fn().mockResolvedValue(undefined),
    loadURL: vi.fn().mockResolvedValue(undefined),
    send: vi.fn(),
    isDestroyed: vi.fn(() => false),
    stop: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
  };

  return {
    session: {
      fromPartition: vi.fn(() => ({})),
    },
    app: {
      name: 'TestApp',
      isPackaged: false,
    },
    BrowserWindow: class {
      constructor() {}
      loadFile = vi.fn().mockResolvedValue(undefined);
      loadURL = vi.fn().mockResolvedValue(undefined);
      get webContents() {
        return webContents;
      }
      get id() {
        return 1;
      }
      contentView = {
        addChildView: vi.fn(),
        removeChildView: vi.fn(),
        children: [],
      };
      getBounds() {
        return { x: 0, y: 0, width: 800, height: 600 };
      }
      getSize() {
        return [800, 600];
      }
      getContentSize() {
        return [800, 600];
      }
      isDestroyed = vi.fn(() => false);
      focus = vi.fn();
      show = vi.fn();
      hide = vi.fn();
      close = vi.fn();
      on = vi.fn();
      once = vi.fn();
      isVisible() {
        return true;
      }
      isMinimized() {
        return false;
      }
      static getAllWindows() {
        return [];
      }
      static getFocusedWindow() {
        return {
          id: 1,
        };
      }
    },
    WebContentsView: class {
      webContents = webContents;
      setBounds = vi.fn();
      getBounds() {
        return { x: 0, y: 0, width: 400, height: 400 };
      }
      setBorderRadius = vi.fn();
      setVisible = vi.fn();
      getVisible() {
        return true;
      }
      setBackgroundColor = vi.fn();
    },
    WebContents: class {
      loadFile = vi.fn().mockResolvedValue(undefined);
      loadURL = vi.fn().mockResolvedValue(undefined);
    },
    Menu: {
      buildFromTemplate: vi.fn(),
      setApplicationMenu: vi.fn(),
    },
  };
});
