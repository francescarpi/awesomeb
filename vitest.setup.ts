import { vi } from 'vitest';

// Build a synchronous mock object using vi.hoisted so the values are available
// at the top of the file (before any imports). This avoids the async import
// pattern in vi.mock factories, which does not get applied to transitive
// imports of dependencies in the test environment.
const mockElectron = vi.hoisted(() => {
  const noopFn = (): void => {};
  const webContents = {
    openDevTools: noopFn,
    id: 1,
    loadFile: (): Promise<void> => Promise.resolve(),
    loadURL: (): Promise<void> => Promise.resolve(),
    send: noopFn,
    isDestroyed: (): boolean => false,
    isFocused: (): boolean => false,
    stop: noopFn,
    close: noopFn,
    on: noopFn,
    removeAllListeners: noopFn,
    focus: noopFn,
    getUserAgent: (): string => 'Mozilla/5.0',
    navigationHistory: {
      canGoBack: (): boolean => false,
      canGoForward: (): boolean => false,
      getAllEntries: (): unknown[] => [],
      getActiveIndex: (): number => 0,
      restore: (): Promise<void> => Promise.resolve(),
    },
    setWindowOpenHandler: noopFn,
    setZoomFactor: vi.fn(),
    setZoomLevel: vi.fn(),
    getZoomFactor: vi.fn((): number => 1),
    getZoomLevel: vi.fn((): number => 0),
    setAudioMuted: noopFn,
    isAudioMuted: (): boolean => false,
    isLoading: (): boolean => false,
    getURL: (): string => '',
    getTitle: (): string => '',
    executeJavaScript: (): Promise<unknown> => Promise.resolve(),
    capturePage: (): Promise<unknown> => Promise.resolve({}),
    printToPDF: (): Promise<Buffer> => Promise.resolve(Buffer.from('')),
    canGoBack: (): boolean => false,
    canGoForward: (): boolean => false,
    goBack: noopFn,
    goForward: noopFn,
    reload: noopFn,
    session: { flushStorageData: (): Promise<void> => Promise.resolve() },
  };

  return {
    __ELECTRON_MOCK_VERSION__: 'awesomeb-mock-v1',
    app: {
      name: 'AwesomeB',
      isPackaged: false,
      isReady: (): boolean => true,
      whenReady: (): Promise<void> => Promise.resolve(),
      getName: (): string => 'AwesomeB',
      getVersion: (): string => '1.0.0',
      getAppPath: (): string => '/tmp/awesomeb',
      getPath: (): string => '/tmp/awesomeb',
      getLocale: (): string => 'en',
      getLocaleCountryCode: (): string => 'US',
      on: noopFn,
      once: noopFn,
      off: noopFn,
      quit: noopFn,
      exit: noopFn,
      setAppUserModelId: noopFn,
      setName: noopFn,
      setPath: noopFn,
      commandLine: { appendSwitch: noopFn, appendArgument: noopFn },
    },
    BrowserWindow: class {
      constructor() {}
      loadFile = (): Promise<void> => Promise.resolve();
      loadURL = (): Promise<void> => Promise.resolve();
      get webContents() {
        return webContents;
      }
      get id() {
        return 1;
      }
      contentView = { addChildView: noopFn, removeChildView: noopFn, children: [] };
      getBounds() {
        return { x: 0, y: 0, width: 800, height: 600 };
      }
      getSize() {
        return [800, 600];
      }
      getContentSize() {
        return [800, 600];
      }
      isDestroyed = (): boolean => false;
      focus = noopFn;
      show = noopFn;
      hide = noopFn;
      close = noopFn;
      destroy = noopFn;
      on = noopFn;
      once = noopFn;
      off = noopFn;
      removeListener = noopFn;
      removeAllListeners = noopFn;
      emit = noopFn;
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
      setBounds = noopFn;
      setSize = noopFn;
      setMinimumSize = noopFn;
      setMaximumSize = noopFn;
      setMenu = noopFn;
      setTitle = noopFn;
      setFullScreen = noopFn;
      setProgressBar = noopFn;
      setIcon = noopFn;
      setParentWindow = noopFn;
      static getAllWindows() {
        return [];
      }
      static getFocusedWindow() {
        return { id: 1 };
      }
    },
    WebContentsView: class {
      webContents = webContents;
      setBounds = noopFn;
      getBounds() {
        return { x: 0, y: 0, width: 400, height: 400 };
      }
      setBorderRadius = noopFn;
      setVisible = noopFn;
      getVisible() {
        return true;
      }
      setBackgroundColor = noopFn;
      setLayoutOptions = noopFn;
    },
    webContents,
    WebContents: class {
      loadFile = (): Promise<void> => Promise.resolve();
      loadURL = (): Promise<void> => Promise.resolve();
    },
    Menu: { buildFromTemplate: noopFn, setApplicationMenu: noopFn, getApplicationMenu: noopFn },
    dialog: {
      showErrorBox: noopFn,
      showMessageBox: (): Promise<{ response: number }> => Promise.resolve({ response: 0 }),
      showMessageBoxSync: (): number => 0,
      showOpenDialog: (): Promise<{ filePaths: string[] }> => Promise.resolve({ filePaths: [] }),
      showSaveDialog: (): Promise<{ filePath: string }> => Promise.resolve({ filePath: '' }),
    },
    contextBridge: { exposeInMainWorld: noopFn, exposeInIsolatedWorld: noopFn },
    ipcRenderer: {
      invoke: (): Promise<unknown> => Promise.resolve(),
      send: noopFn,
      on: noopFn,
      once: noopFn,
      off: noopFn,
      removeListener: noopFn,
      removeAllListeners: noopFn,
      sendSync: (): unknown => undefined,
      sendToHost: noopFn,
    },
    ipcMain: {
      on: noopFn,
      once: noopFn,
      off: noopFn,
      removeListener: noopFn,
      removeAllListeners: noopFn,
      handle: noopFn,
      handleOnce: noopFn,
      removeHandler: noopFn,
      emit: noopFn,
    },
    protocol: {
      registerSchemesAsPrivileged: noopFn,
      registerFileProtocol: noopFn,
      registerBufferProtocol: noopFn,
      registerHttpProtocol: noopFn,
      registerStreamProtocol: noopFn,
      registerStringProtocol: noopFn,
      registerStandardSchemes: noopFn,
      unregisterProtocol: noopFn,
      interceptFileProtocol: noopFn,
      interceptBufferProtocol: noopFn,
      interceptHttpProtocol: noopFn,
      interceptStreamProtocol: noopFn,
      interceptStringProtocol: noopFn,
      uninterceptProtocol: noopFn,
    },
    clipboard: {
      readText: async (): Promise<string> => '',
      writeText: async (): Promise<void> => {},
      readImage: noopFn,
      writeImage: noopFn,
      readHTML: (): string => '',
      writeHTML: noopFn,
      readRTF: (): string => '',
      writeRTF: noopFn,
      readBookmark: noopFn,
      writeBookmark: noopFn,
      clear: (): void => {},
      availableFormats: (): string[] => [],
      has: async (): Promise<boolean> => false,
    },
    nativeImage: {
      createEmpty: (): unknown => ({
        toPNG: (): Buffer => Buffer.from(''),
        toDataURL: (): string => '',
        toBitmap: (): Buffer => Buffer.from(''),
        getSize: (): { width: number; height: number } => ({ width: 0, height: 0 }),
        isEmpty: (): boolean => true,
      }),
      createFromPath: (): unknown => ({
        toPNG: (): Buffer => Buffer.from(''),
        toDataURL: (): string => '',
        toBitmap: (): Buffer => Buffer.from(''),
        getSize: (): { width: number; height: number } => ({ width: 0, height: 0 }),
        isEmpty: (): boolean => true,
      }),
      createFromBuffer: (): unknown => ({
        toPNG: (): Buffer => Buffer.from(''),
        toDataURL: (): string => '',
        toBitmap: (): Buffer => Buffer.from(''),
        getSize: (): { width: number; height: number } => ({ width: 0, height: 0 }),
        isEmpty: (): boolean => true,
      }),
      createFromDataURL: (): unknown => ({
        toPNG: (): Buffer => Buffer.from(''),
        toDataURL: (): string => '',
        toBitmap: (): Buffer => Buffer.from(''),
        getSize: (): { width: number; height: number } => ({ width: 0, height: 0 }),
        isEmpty: (): boolean => true,
      }),
      createFromBitmap: (): unknown => ({
        toPNG: (): Buffer => Buffer.from(''),
        toDataURL: (): string => '',
        toBitmap: (): Buffer => Buffer.from(''),
        getSize: (): { width: number; height: number } => ({ width: 0, height: 0 }),
        isEmpty: (): boolean => true,
      }),
    },
    net: {
      request: (): unknown => ({
        on: noopFn,
        once: noopFn,
        end: noopFn,
        write: noopFn,
        abort: noopFn,
      }),
      fetch: (): Promise<unknown> => Promise.resolve({}),
    },
    Notification: vi.fn().mockImplementation(function () {
      return {
        on: noopFn,
        show: noopFn,
      };
    }),
    shell: {
      openExternal: (): Promise<void> => Promise.resolve(),
      openPath: (): Promise<string> => Promise.resolve(''),
      showItemInFolder: noopFn,
      beep: noopFn,
      trashItem: (): Promise<void> => Promise.resolve(),
      readShortcutLink: (): Record<string, unknown> => ({}),
      writeShortcutLink: (): boolean => true,
    },
    screen: {
      getCursorScreenPoint: (): { x: number; y: number } => ({ x: 0, y: 0 }),
      getPrimaryDisplay: (): unknown => ({
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
      }),
      getAllDisplays: (): unknown[] => [],
      getDisplayMatching: noopFn,
      getDisplayNearestPoint: noopFn,
      getDisplayNearestWindow: noopFn,
      on: noopFn,
      off: noopFn,
      getDipToScreenRect: noopFn,
      dipToScreenPoint: noopFn,
      dipToScreenRect: noopFn,
    },
    desktopCapturer: { getSources: (): Promise<unknown[]> => Promise.resolve([]) },
    autoUpdater: {
      logger: null,
      forceDevUpdateConfig: false,
      checkForUpdates: vi.fn(),
      quitAndInstall: vi.fn(),
      on: noopFn,
      emit: noopFn,
    },
    session: {
      fromPartition: (): unknown => ({
        registerPreloadScript: noopFn,
        setSpellCheckerLanguages: noopFn,
      }),
      defaultSession: {
        fromPartition: (): unknown => ({
          registerPreloadScript: noopFn,
          setSpellCheckerLanguages: noopFn,
        }),
      },
    },
    globalShortcut: {
      register: (): boolean => true,
      unregister: (): boolean => true,
      unregisterAll: noopFn,
      isRegistered: (): boolean => false,
    },
    powerMonitor: {
      on: noopFn,
      once: noopFn,
      off: noopFn,
      getSystemIdleTime: (): number => 0,
      getSystemIdleState: (): string => 'active',
      isOnBatteryPower: (): boolean => false,
    },
    systemPreferences: {
      getColor: (): string => '',
      getMediaAccessStatus: (): string => 'granted',
      getAppLevelAppearance: (): string => 'system',
      getSystemColor: (): string => '',
      isDarkMode: (): boolean => false,
      isInvertedColorScheme: (): boolean => false,
      isHighContrastColorScheme: (): boolean => false,
      isReducedTransparency: (): boolean => false,
      on: noopFn,
    },
    crashReporter: {
      start: noopFn,
      getLastCrashReport: noopFn,
      getUploadedReports: (): Promise<unknown[]> => Promise.resolve([]),
      setExtraParameters: noopFn,
      addExtraParameter: noopFn,
      removeExtraParameter: noopFn,
      getParameters: (): Record<string, unknown> => ({}),
    },
    safeStorage: {
      isEncryptionAvailable: (): boolean => true,
      encryptString: (s: string): Buffer => Buffer.from(s),
      decryptString: (b: Buffer): string => b.toString(),
      setUsePlainTextEncryption: noopFn,
      getSelectedStorageBackend: (): string => 'basic_text',
    },
    utilityProcess: {
      fork: (): unknown => ({
        pid: 1,
        on: noopFn,
        once: noopFn,
        off: noopFn,
        postMessage: noopFn,
        kill: noopFn,
      }),
    },
  };
});

const mockElectronLog = vi.hoisted(() => {
  const noopFn = (): void => {};
  const scopeLog = {
    info: noopFn,
    debug: noopFn,
    warn: noopFn,
    error: noopFn,
    verbose: noopFn,
    silly: noopFn,
    log: noopFn,
    trace: noopFn,
  };
  const log = {
    ...scopeLog,
    scope: (): typeof scopeLog => scopeLog,
    transports: { file: { level: false }, console: { level: false } },
    patchAll: noopFn,
  };
  return {
    default: log,
    scope: (): typeof scopeLog => scopeLog,
    transports: log.transports,
    patchAll: log.patchAll,
    info: noopFn,
    debug: noopFn,
    warn: noopFn,
    error: noopFn,
  };
});

const mockElectronContextMenu = vi.hoisted(() => ({
  default: (): void => {},
  init: (): void => {},
  contextMenu: (): void => {},
  dispose: (): void => {},
}));

const mockElectronUpdater = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  return {
    autoUpdater: {
      logger: null,
      forceDevUpdateConfig: false,
      checkForUpdates: vi.fn(),
      quitAndInstall: vi.fn(),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(event, handler);
      }),
      emit: (event: string, ...args: unknown[]): void => {
        const handler = handlers.get(event);
        if (handler) {
          handler(...args);
        }
      },
    },
  };
});

vi.mock('electron', () => mockElectron);
vi.mock('electron-log', () => mockElectronLog);
vi.mock('electron-context-menu', () => mockElectronContextMenu);
vi.mock('electron-updater', () => mockElectronUpdater);

process.env.TEST = 'true';

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Text = dom.window.Text;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
