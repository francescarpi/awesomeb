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
            shortName: null,
            longName: null,
            tabContainers: [],
            theme: 'blue',
          },
          {
            id: 2,
            shortName: null,
            longName: null,
            tabContainers: [],
            theme: 'blue',
          },
          {
            id: 3,
            shortName: null,
            longName: null,
            tabContainers: [],
            theme: 'blue',
          },
          {
            id: 4,
            shortName: null,
            longName: null,
            tabContainers: [],
            theme: 'blue',
          },
          {
            id: 5,
            shortName: null,
            longName: null,
            tabContainers: [],
            theme: 'blue',
          },
        ],
        selectedDesktopId: 1,
        sidebarCollapsed: false,
      },
    ]);
  });

  test('constructor succeeds with valid defaults', () => {
    const session = new Session(browser);
    expect(session).toBeDefined();
    expect(session.windows).toEqual([]);
  });

  test('constructor with corrupted disk falls back to defaults', () => {
    const filePath = getSessionFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        windows: 'not-an-array',
      }),
    );

    const session = new Session(browser);
    expect(session).toBeDefined();
    expect(session.windows).toEqual([]);
  });

  test('sessionToStore() validates on read', () => {
    const mockBrowser = {
      get windows() {
        return [
          {
            id: 'invalid-id',
            bounds: { x: 0, y: 0, width: 800, height: 600 },
            selectedDesktop: { id: 1 },
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

  describe('openTabsAsChild persistence', () => {
    test('round-trips true through save and reload', async () => {
      const result = await browser.openURL('http://example.com');
      result!.tab.setOpenTabsAsChild(true);

      const session = new Session(browser);
      await session.save();

      const persisted = JSON.parse(fs.readFileSync(getSessionFilePath(), 'utf-8'));
      const tab = persisted.windows[0].desktops[0].tabContainers[0].tabs[0];
      expect(tab.openTabsAsChild).toBe(true);
    });

    test('defaults to false when the field is missing in session.json (legacy)', () => {
      const filePath = getSessionFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          windows: [
            {
              id: 1,
              bounds: { x: 0, y: 0, width: 800, height: 600 },
              selectedDesktopId: 1,
              sidebarCollapsed: false,
              areaMaximized: false,
              desktops: [
                {
                  id: 1,
                  shortName: null,
                  longName: null,
                  theme: 'blue',
                  tabContainers: [
                    {
                      id: 1,
                      divider: false,
                      tabs: [
                        {
                          id: 1,
                          partitionId: 'default',
                          title: null,
                          customTitle: null,
                          url: 'http://example.com',
                          favicon: null,
                          closedAt: null,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      );

      const session = new Session(browser);

      expect(session.windows[0].desktops[0].tabContainers[0].tabs[0].openTabsAsChild).toBe(false);
    });
  });

  describe('parentTabId persistence', () => {
    test('round-trips parentTabId through save and reload', async () => {
      const parent = (await browser.openURL('http://parent.example.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      const child = (await browser.openURL('http://child.example.com'))!;

      const session = new Session(browser);
      await session.save();

      const persisted = JSON.parse(fs.readFileSync(getSessionFilePath(), 'utf-8'));
      const allTabContainers = persisted.windows[0].desktops[0].tabContainers as {
        id: number;
        parentTabId: number | null;
      }[];
      const parentTcStore = allTabContainers.find((tc) => tc.id === parent.tabContainer.id);
      const childTcStore = allTabContainers.find((tc) => tc.id === child.tabContainer.id);
      expect(parentTcStore).toBeDefined();
      expect(childTcStore).toBeDefined();
      expect(parentTcStore!.parentTabId).toBeNull();
      expect(childTcStore!.parentTabId).toBe(parent.tab.id);
    });

    test('restores _parent reference when loadSession is called', async () => {
      const parent = (await browser.openURL('http://parent.example.com', { selectTab: true }))!;
      parent.tab.setOpenTabsAsChild(true);
      const child = (await browser.openURL('http://child.example.com'))!;
      const childContainerId = child.tabContainer.id;
      const parentId = parent.tab.id;

      const session = new Session(browser);
      await session.save();

      const freshBrowser = new Browser();
      await freshBrowser.loadSession();
      const restoredChildContainer = freshBrowser.tabs
        .map((r) => r.tabContainer)
        .find((tc) => tc.id === childContainerId);
      const restoredParent = freshBrowser.getTab(parentId);

      expect(restoredChildContainer).toBeDefined();
      expect(restoredParent).not.toBeNull();
      expect(restoredChildContainer!.parentTab).toBe(restoredParent!.tab);
    });

    test('treats missing parent as orphan (logs warning, sets parent to null)', async () => {
      const filePath = getSessionFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          windows: [
            {
              id: 1,
              bounds: { x: 0, y: 0, width: 800, height: 600 },
              selectedDesktopId: 1,
              sidebarCollapsed: false,
              areaMaximized: false,
              desktops: [
                {
                  id: 1,
                  shortName: null,
                  longName: null,
                  theme: 'blue',
                  tabContainers: [
                    {
                      id: 1,
                      divider: false,
                      parentTabId: 999,
                      tabs: [
                        {
                          id: 1,
                          partitionId: 'default',
                          title: null,
                          customTitle: null,
                          url: 'http://child.example.com',
                          favicon: null,
                          closedAt: null,
                          openTabsAsChild: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      );

      const freshBrowser = new Browser();
      await freshBrowser.loadSession();
      const restoredContainer = freshBrowser.tabs
        .map((r) => r.tabContainer)
        .find((tc) => tc.id === 1);

      expect(restoredContainer).toBeDefined();
      expect(restoredContainer!.parentTab).toBeNull();
    });

    test('defaults to null when the field is missing in session.json (legacy)', async () => {
      const filePath = getSessionFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          windows: [
            {
              id: 1,
              bounds: { x: 0, y: 0, width: 800, height: 600 },
              selectedDesktopId: 1,
              sidebarCollapsed: false,
              areaMaximized: false,
              desktops: [
                {
                  id: 1,
                  shortName: null,
                  longName: null,
                  theme: 'blue',
                  tabContainers: [
                    {
                      id: 1,
                      divider: false,
                      tabs: [
                        {
                          id: 1,
                          partitionId: 'default',
                          title: null,
                          customTitle: null,
                          url: 'http://example.com',
                          favicon: null,
                          closedAt: null,
                          openTabsAsChild: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      );

      const freshBrowser = new Browser();
      await freshBrowser.loadSession();
      const loaded = freshBrowser.getTab(1);

      expect(loaded).not.toBeNull();
      expect(loaded!.tab.parentTab).toBeNull();
    });
  });

  describe('legacy "name" field migration', () => {
    function writeLegacySessionFile(desktops: unknown[]) {
      const filePath = getSessionFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const legacyData = {
        windows: [
          {
            id: 1,
            bounds: { x: 0, y: 0, width: 800, height: 600 },
            selectedDesktopId: 1,
            sidebarCollapsed: false,
            areaMaximized: false,
            desktops,
          },
        ],
      };
      fs.writeFileSync(filePath, JSON.stringify(legacyData));
    }

    test('migrates legacy "name" to both shortName and longName on load', () => {
      writeLegacySessionFile([
        {
          id: 1,
          name: 'Work',
          theme: 'blue',
          tabContainers: [],
        },
        {
          id: 2,
          name: 'Personal',
          theme: 'purple',
          tabContainers: [],
        },
      ]);

      const session = new Session(browser);

      expect(session.windows[0].desktops[0]).toEqual({
        id: 1,
        shortName: 'Work',
        longName: 'Work',
        theme: 'blue',
        tabContainers: [],
      });
      expect(session.windows[0].desktops[1]).toEqual({
        id: 2,
        shortName: 'Personal',
        longName: 'Personal',
        theme: 'purple',
        tabContainers: [],
      });
    });

    test('migrates legacy "name: null" to both fields null', () => {
      writeLegacySessionFile([
        {
          id: 1,
          name: null,
          theme: 'blue',
          tabContainers: [],
        },
      ]);

      const session = new Session(browser);

      expect(session.windows[0].desktops[0].shortName).toBeNull();
      expect(session.windows[0].desktops[0].longName).toBeNull();
    });

    test('loads new shortName/longName fields as-is (no legacy name)', () => {
      writeLegacySessionFile([
        {
          id: 1,
          shortName: 'W',
          longName: 'Work Space',
          theme: 'blue',
          tabContainers: [],
        },
      ]);

      const session = new Session(browser);

      expect(session.windows[0].desktops[0].shortName).toBe('W');
      expect(session.windows[0].desktops[0].longName).toBe('Work Space');
    });

    test('handles mixed legacy and new fields in same session', () => {
      writeLegacySessionFile([
        {
          id: 1,
          name: 'Legacy',
          theme: 'blue',
          tabContainers: [],
        },
        {
          id: 2,
          shortName: 'W',
          longName: 'New Desktop',
          theme: 'purple',
          tabContainers: [],
        },
      ]);

      const session = new Session(browser);

      expect(session.windows[0].desktops[0].shortName).toBe('Legacy');
      expect(session.windows[0].desktops[0].longName).toBe('Legacy');
      expect(session.windows[0].desktops[1].shortName).toBe('W');
      expect(session.windows[0].desktops[1].longName).toBe('New Desktop');
    });

    test('save() output uses the new field names (no legacy "name" key)', async () => {
      const session = new Session(browser);
      await session.save();

      const persisted = JSON.parse(fs.readFileSync(getSessionFilePath(), 'utf-8'));
      const desktop = persisted.windows[0].desktops[0];
      expect(desktop).toHaveProperty('shortName');
      expect(desktop).toHaveProperty('longName');
      expect(desktop).not.toHaveProperty('name');
    });

    test('save() persists shortName/longName values to disk', async () => {
      const session = new Session(browser);
      browser.activeWindow!.getDesktop(1)!.setName('W', 'Work Space');
      await session.save();

      const persisted = JSON.parse(fs.readFileSync(getSessionFilePath(), 'utf-8'));
      const desktop = persisted.windows[0].desktops[0];
      expect(desktop.shortName).toBe('W');
      expect(desktop.longName).toBe('Work Space');
    });
  });
});
