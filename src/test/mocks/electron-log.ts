import { vi } from 'vitest';

const createScope = () => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
  silly: vi.fn(),
  log: vi.fn(),
  trace: vi.fn(),
});

const mockLogger = {
  ...createScope(),
  scope: vi.fn(() => createScope()),
  transports: {
    file: {
      level: false,
      file: '',
      format: '',
      maxSize: 0,
      getFile: vi.fn(),
      set file(_v: string) {},
      get level() {
        return false;
      },
      set level(_v: unknown) {},
    },
    console: {
      level: false,
      format: '',
      get level() {
        return false;
      },
      set level(_v: unknown) {},
    },
  },
  hooks: [],
  patchAll: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  verbose: vi.fn(),
  silly: vi.fn(),
  log: vi.fn(),
  trace: vi.fn(),
};

export default mockLogger;
export const scope = mockLogger.scope;
export const transports = mockLogger.transports;
export const patchAll = mockLogger.patchAll;
export const info = mockLogger.info;
export const debug = mockLogger.debug;
export const warn = mockLogger.warn;
export const error = mockLogger.error;
export const verbose = mockLogger.verbose;
export const silly = mockLogger.silly;
export const log = mockLogger.log;
export const trace = mockLogger.trace;
