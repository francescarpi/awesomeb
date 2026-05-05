import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Text = dom.window.Text;
global.Element = dom.window.Element;
global.Node = dom.window.Node;

vi.mock('electron-context-menu', () => ({
  default: vi.fn(),
}));

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
  let webContentsIdCounter = 1;

  const createWebContents = () => ({
    openDevTools: vi.fn(),
    id: webContentsIdCounter++,
    loadFile: vi.fn().mockResolvedValue(undefined),
    loadURL: vi.fn().mockResolvedValue(undefined),
    send: vi.fn(),
    isDestroyed: vi.fn(() => false),
    stop: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    focus: vi.fn(),
    getUserAgent: vi.fn(
      () =>
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) AwesomeB/1.0.0 Chrome/144.0.7559.96 Electron/40.1.0 Safari/537.36',
    ),
    navigationHistory: {
      canGoBack: vi.fn(() => false),
      canGoForward: vi.fn(() => false),
      getAllEntries: vi.fn(() => []),
      getActiveIndex: vi.fn(() => 0),
      restore: vi.fn().mockResolvedValue(undefined),
    },
    setWindowOpenHandler: vi.fn(),
  });

  const webContents = createWebContents();

  return {
    session: {
      fromPartition: vi.fn(() => ({})),
    },
    app: {
      name: 'AwesomeB',
      isPackaged: false,
      getName: vi.fn(() => 'AwesomeB'),
      getVersion: vi.fn(() => '1.0.0'),
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
      webContents = createWebContents();
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
