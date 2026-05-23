import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { Browser, Session, partitions } from '@/core';
import { ZodError } from 'zod';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';

// Helper to get the session file path (must match electron-store's naming)
function getSessionFilePath() {
  return path.join(userDataPath(), 'session.json');
}

// Helper to clean up session file between tests
function cleanSessionFile() {
  const filePath = getSessionFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('Session', () => {
  let browser: Browser;

  beforeEach(() => {
    cleanSessionFile();
    browser = new Browser();
    partitions.init();
    const window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  afterEach(() => {
    cleanSessionFile();
  });

  test('session data structure should match expected format', () => {
    const session = new Session(browser);

    expect(session.sessionToStore()).toEqual([
      {
        id: 1,
        areaMaximized: false,
        bounds: {
          height: 600,
          width: 800,
          x: 0,
          y: 0,
        },
        desktops: [
          {
            id: 1,
            name: null,
            tabContainers: [],
            theme: 'blue',
          },
          {
            id: 2,
            name: null,
            tabContainers: [],
            theme: 'blue',
          },
          {
            id: 3,
            name: null,
            tabContainers: [],
            theme: 'blue',
          },
          {
            id: 4,
            name: null,
            tabContainers: [],
            theme: 'blue',
          },
          {
            id: 5,
            name: null,
            tabContainers: [],
            theme: 'blue',
          },
        ],
        selectedDesktopId: 1,
        sidebarCollapsed: false,
        visibleDesktopsRange: [1, 5],
      },
    ]);
  });

  test('constructor succeeds with valid defaults', () => {
    const session = new Session(browser);
    expect(session).toBeDefined();
    expect(session.windows).toEqual([]);
  });

  test('constructor with corrupted disk throws ZodError', () => {
    const filePath = getSessionFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        windows: 'not-an-array',
      }),
    );

    expect(() => new Session(browser)).toThrow(ZodError);
  });

  test('sessionToStore() validates on read', () => {
    const mockBrowser = {
      get windows() {
        return [
          {
            id: 'invalid-id',
            bounds: { x: 0, y: 0, width: 800, height: 600 },
            selectedDesktop: { id: 1 },
            visibleDesktopsRange: [1, 5],
            sidebarCollapsed: false,
            areaMaximized: false,
            desktops: [],
          },
        ];
      },
    } as unknown as Browser;

    const session = new Session(mockBrowser);
    expect(() => session.sessionToStore()).toThrow(ZodError);
  });

  test('save() validates before persisting', async () => {
    const mockBrowser = {
      get windows() {
        return [
          {
            id: 'invalid-id',
            bounds: { x: 0, y: 0, width: 800, height: 600 },
            selectedDesktop: { id: 1 },
            visibleDesktopsRange: [1, 5],
            sidebarCollapsed: false,
            areaMaximized: false,
            desktops: [],
          },
        ];
      },
    } as unknown as Browser;

    const session = new Session(mockBrowser);
    await expect(session.save()).rejects.toThrow(ZodError);
  });

  test('empty windows array is valid', () => {
    const session = new Session(browser);
    // After construction with a real browser, the store defaults are empty
    expect(session.windows).toEqual([]);
  });
});
