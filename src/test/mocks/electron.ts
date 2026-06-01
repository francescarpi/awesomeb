import { vi } from 'vitest';

// Marker used to verify this mock is the one being loaded
export const __ELECTRON_MOCK_VERSION__ = 'awesomeb-mock-v1';

let webContentsIdCounter = 1;

const createWebContents = () => ({
  openDevTools: vi.fn(),
  id: webContentsIdCounter++,
  loadFile: vi.fn().mockResolvedValue(undefined),
  loadURL: vi.fn().mockResolvedValue(undefined),
  send: vi.fn(),
  isDestroyed: vi.fn(() => false),
  isFocused: vi.fn(() => false),
  stop: vi.fn(),
  close: vi.fn(),
  on: vi.fn(),
  removeAllListeners: vi.fn(),
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
  setZoomFactor: vi.fn(),
  setZoomLevel: vi.fn(),
  getZoomFactor: vi.fn(() => 1),
  getZoomLevel: vi.fn(() => 0),
  setAudioMuted: vi.fn(),
  isAudioMuted: vi.fn(() => false),
  isLoading: vi.fn(() => false),
  getURL: vi.fn(() => ''),
  getTitle: vi.fn(() => ''),
  executeJavaScript: vi.fn().mockResolvedValue(undefined),
  capturePage: vi.fn().mockResolvedValue({}),
  printToPDF: vi.fn().mockResolvedValue(Buffer.from('')),
  canGoBack: vi.fn(() => false),
  canGoForward: vi.fn(() => false),
  goBack: vi.fn(),
  goForward: vi.fn(),
  reload: vi.fn(),
  session: {
    flushStorageData: vi.fn().mockResolvedValue(undefined),
  },
});

const webContents = createWebContents();

export const session = {
  fromPartition: vi.fn(() => ({
    registerPreloadScript: vi.fn(),
    setSpellCheckerLanguages: vi.fn(),
  })),
  defaultSession: {
    fromPartition: vi.fn(() => ({
      registerPreloadScript: vi.fn(),
      setSpellCheckerLanguages: vi.fn(),
    })),
  },
};

export const app = {
  name: 'AwesomeB',
  isPackaged: false,
  isReady: vi.fn(() => true),
  whenReady: vi.fn().mockResolvedValue(undefined),
  getName: vi.fn(() => 'AwesomeB'),
  getVersion: vi.fn(() => '1.0.0'),
  getAppPath: vi.fn(() => '/tmp/awesomeb'),
  getPath: vi.fn(() => '/tmp/awesomeb'),
  getLocale: vi.fn(() => 'en'),
  getLocaleCountryCode: vi.fn(() => 'US'),
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  quit: vi.fn(),
  exit: vi.fn(),
  setAppUserModelId: vi.fn(),
  setName: vi.fn(),
  setPath: vi.fn(),
  commandLine: {
    appendSwitch: vi.fn(),
    appendArgument: vi.fn(),
  },
};

export class BrowserWindow {
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
  destroy = vi.fn();
  on = vi.fn();
  once = vi.fn();
  off = vi.fn();
  removeListener = vi.fn();
  removeAllListeners = vi.fn();
  emit = vi.fn();
  isVisible() {
    return true;
  }
  isMinimized() {
    return false;
  }
  isMaximized() {
    return false;
  }
  isFullScreen() {
    return false;
  }
  setBounds = vi.fn();
  setSize = vi.fn();
  setMinimumSize = vi.fn();
  setMaximumSize = vi.fn();
  setMenu = vi.fn();
  setTitle = vi.fn();
  setFullScreen = vi.fn();
  setProgressBar = vi.fn();
  setIcon = vi.fn();
  setParentWindow = vi.fn();
  static getAllWindows() {
    return [];
  }
  static getFocusedWindow() {
    return {
      id: 1,
    };
  }
}

export class WebContentsView {
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
  setLayoutOptions = vi.fn();
}

export class WebContents {
  loadFile = vi.fn().mockResolvedValue(undefined);
  loadURL = vi.fn().mockResolvedValue(undefined);
  openDevTools = vi.fn();
  closeDevTools = vi.fn();
  isDevToolsOpened = vi.fn(() => false);
  send = vi.fn();
  on = vi.fn();
  once = vi.fn();
  off = vi.fn();
  removeAllListeners = vi.fn();
  isDestroyed = vi.fn(() => false);
  getURL = vi.fn(() => '');
  getTitle = vi.fn(() => '');
  id = 1;
  session = {
    flushStorageData: vi.fn().mockResolvedValue(undefined),
  };
  setWindowOpenHandler = vi.fn();
  setZoomFactor = vi.fn();
  setZoomLevel = vi.fn();
  getZoomFactor = vi.fn(() => 1);
  getZoomLevel = vi.fn(() => 0);
  setAudioMuted = vi.fn();
  isAudioMuted = vi.fn(() => false);
  isLoading = vi.fn(() => false);
  executeJavaScript = vi.fn().mockResolvedValue(undefined);
  capturePage = vi.fn().mockResolvedValue({});
  printToPDF = vi.fn().mockResolvedValue(Buffer.from(''));
  canGoBack = vi.fn(() => false);
  canGoForward = vi.fn(() => false);
  goBack = vi.fn();
  goForward = vi.fn();
  reload = vi.fn();
  navigationHistory = {
    canGoBack: vi.fn(() => false),
    canGoForward: vi.fn(() => false),
    getAllEntries: vi.fn(() => []),
    getActiveIndex: vi.fn(() => 0),
    restore: vi.fn().mockResolvedValue(undefined),
  };
}

export const Menu = {
  buildFromTemplate: vi.fn(),
  setApplicationMenu: vi.fn(),
  getApplicationMenu: vi.fn(),
};

export const dialog = {
  showErrorBox: vi.fn(),
  showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
  showMessageBoxSync: vi.fn(() => 0),
  showOpenDialog: vi.fn().mockResolvedValue({ filePaths: [] }),
  showSaveDialog: vi.fn().mockResolvedValue({ filePath: '' }),
};

export const contextBridge = {
  exposeInMainWorld: vi.fn(),
  exposeInIsolatedWorld: vi.fn(),
};

export const ipcRenderer = {
  invoke: vi.fn().mockResolvedValue(undefined),
  send: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
  sendSync: vi.fn().mockReturnValue(undefined),
  sendToHost: vi.fn(),
};

export const ipcMain = {
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
  handle: vi.fn(),
  handleOnce: vi.fn(),
  removeHandler: vi.fn(),
  emit: vi.fn(),
};

export const protocol = {
  registerSchemesAsPrivileged: vi.fn(),
  registerFileProtocol: vi.fn(),
  registerBufferProtocol: vi.fn(),
  registerHttpProtocol: vi.fn(),
  registerStreamProtocol: vi.fn(),
  registerStringProtocol: vi.fn(),
  registerStandardSchemes: vi.fn(),
  unregisterProtocol: vi.fn(),
  interceptFileProtocol: vi.fn(),
  interceptBufferProtocol: vi.fn(),
  interceptHttpProtocol: vi.fn(),
  interceptStreamProtocol: vi.fn(),
  interceptStringProtocol: vi.fn(),
  uninterceptProtocol: vi.fn(),
};

export const clipboard = {
  readText: vi.fn(() => ''),
  writeText: vi.fn(),
  readImage: vi.fn(),
  writeImage: vi.fn(),
  readHTML: vi.fn(() => ''),
  writeHTML: vi.fn(),
  readRTF: vi.fn(() => ''),
  writeRTF: vi.fn(),
  readBookmark: vi.fn(),
  writeBookmark: vi.fn(),
  clear: vi.fn(),
  availableFormats: vi.fn(() => []),
  has: vi.fn(() => false),
};

export const nativeImage = {
  createEmpty: vi.fn(() => ({
    toPNG: vi.fn(() => Buffer.from('')),
    toDataURL: vi.fn(() => ''),
    toBitmap: vi.fn(() => Buffer.from('')),
    getSize: vi.fn(() => ({ width: 0, height: 0 })),
    isEmpty: vi.fn(() => true),
  })),
  createFromPath: vi.fn(() => ({
    toPNG: vi.fn(() => Buffer.from('')),
    toDataURL: vi.fn(() => ''),
    toBitmap: vi.fn(() => Buffer.from('')),
    getSize: vi.fn(() => ({ width: 0, height: 0 })),
    isEmpty: vi.fn(() => true),
  })),
  createFromBuffer: vi.fn(() => ({
    toPNG: vi.fn(() => Buffer.from('')),
    toDataURL: vi.fn(() => ''),
    toBitmap: vi.fn(() => Buffer.from('')),
    getSize: vi.fn(() => ({ width: 0, height: 0 })),
    isEmpty: vi.fn(() => true),
  })),
  createFromDataURL: vi.fn(() => ({
    toPNG: vi.fn(() => Buffer.from('')),
    toDataURL: vi.fn(() => ''),
    toBitmap: vi.fn(() => Buffer.from('')),
    getSize: vi.fn(() => ({ width: 0, height: 0 })),
    isEmpty: vi.fn(() => true),
  })),
  createFromBitmap: vi.fn(() => ({
    toPNG: vi.fn(() => Buffer.from('')),
    toDataURL: vi.fn(() => ''),
    toBitmap: vi.fn(() => Buffer.from('')),
    getSize: vi.fn(() => ({ width: 0, height: 0 })),
    isEmpty: vi.fn(() => true),
  })),
};

export const net = {
  request: vi.fn(() => ({
    on: vi.fn(),
    once: vi.fn(),
    end: vi.fn(),
    write: vi.fn(),
    abort: vi.fn(),
  })),
  fetch: vi.fn().mockResolvedValue({} as Response),
};

export const shell = {
  openExternal: vi.fn().mockResolvedValue(undefined),
  openPath: vi.fn().mockResolvedValue(''),
  showItemInFolder: vi.fn(),
  beep: vi.fn(),
  trashItem: vi.fn().mockResolvedValue(undefined),
  readShortcutLink: vi.fn(() => ({})),
  writeShortcutLink: vi.fn(() => true),
};

export const screen = {
  getCursorScreenPoint: vi.fn(() => ({ x: 0, y: 0 })),
  getPrimaryDisplay: vi.fn(() => ({
    id: 1,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    scaleFactor: 1,
    rotation: 0,
    internal: false,
    colorDepth: 24,
    colorSpace: 'srgb',
    displayFrequency: 60,
    monochrome: false,
    accelerometerSupport: 'unknown',
    touchSupport: 'unknown',
  })),
  getAllDisplays: vi.fn(() => []),
  getDisplayMatching: vi.fn(),
  getDisplayNearestPoint: vi.fn(),
  getDisplayNearestWindow: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getDipToScreenRect: vi.fn(),
  dipToScreenPoint: vi.fn(),
  dipToScreenRect: vi.fn(),
};

export const desktopCapturer = {
  getSources: vi.fn().mockResolvedValue([]),
};

export const globalShortcut = {
  register: vi.fn(() => true),
  unregister: vi.fn(() => true),
  unregisterAll: vi.fn(),
  isRegistered: vi.fn(() => false),
};

export const powerMonitor = {
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  getSystemIdleTime: vi.fn(() => 0),
  getSystemIdleState: vi.fn(() => 'active'),
  isOnBatteryPower: vi.fn(() => false),
};

export const systemPreferences = {
  getColor: vi.fn(() => ''),
  getMediaAccessStatus: vi.fn(() => 'granted'),
  getAppLevelAppearance: vi.fn(() => 'system'),
  getSystemColor: vi.fn(() => ''),
  isDarkMode: vi.fn(() => false),
  isInvertedColorScheme: vi.fn(() => false),
  isHighContrastColorScheme: vi.fn(() => false),
  isReducedTransparency: vi.fn(() => false),
  on: vi.fn(),
};

export const crashReporter = {
  start: vi.fn(),
  getLastCrashReport: vi.fn(),
  getUploadedReports: vi.fn().mockResolvedValue([]),
  setExtraParameters: vi.fn(),
  addExtraParameter: vi.fn(),
  removeExtraParameter: vi.fn(),
  getParameters: vi.fn(() => ({})),
};

export const safeStorage = {
  isEncryptionAvailable: vi.fn(() => true),
  encryptString: vi.fn((s: string) => Buffer.from(s)),
  decryptString: vi.fn((b: Buffer) => b.toString()),
  setUsePlainTextEncryption: vi.fn(),
  getSelectedStorageBackend: vi.fn(() => 'basic_text'),
};

export const utilityProcess = {
  fork: vi.fn(() => ({
    pid: 1,
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    postMessage: vi.fn(),
    kill: vi.fn(),
  })),
};

export type Certificate = Record<string, unknown>;
export type FindInPageOptions = Record<string, unknown>;
export type IpcMainInvokeEvent = Record<string, unknown>;
export type IpcMainEvent = Record<string, unknown>;
export type IpcRendererEvent = Record<string, unknown>;
export type HandlerDetails = Record<string, unknown>;
export type NavigationEntry = Record<string, unknown>;
export type Rectangle = { x: number; y: number; width: number; height: number };
export type Session = Record<string, unknown>;
export type MenuItemConstructorOptions = Record<string, unknown>;
export type NativeImage = Record<string, unknown>;
export type Result = Record<string, unknown>;
export type DownloadItem = Record<string, unknown>;
