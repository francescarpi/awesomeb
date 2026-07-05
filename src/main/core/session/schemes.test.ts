import { expect, test, describe } from 'vitest';
import {
  SessionStoreScheme,
  SessionWindowScheme,
  SessionDesktopScheme,
  SessionTabContainerScheme,
  SessionTabScheme,
  RectangleScheme,
} from './schemes';
import { ZodError } from 'zod';

const validRectangle = {
  x: 0,
  y: 0,
  width: 800,
  height: 600,
};

const validSessionTab = {
  id: 1,
  partitionId: 'default',
  title: 'Example',
  customTitle: null,
  url: 'https://example.com',
  favicon: null,
  closedAt: null,
  openTabsAsChild: false,
  position: 0,
};

const validSessionTabContainer = {
  id: 1,
  divider: false,
  parentTabId: null,
  position: 0,
  tabs: [validSessionTab],
};

const validSessionDesktop = {
  id: 1,
  shortName: null,
  longName: null,
  theme: 'blue',
  tabContainers: [validSessionTabContainer],
};

const validSessionWindow = {
  id: 1,
  bounds: validRectangle,
  selectedDesktopId: 1,
  sidebarCollapsed: false,
  areaMaximized: false,
  desktops: [validSessionDesktop],
};

const validSessionStore = {
  windows: [validSessionWindow],
};

describe('RectangleScheme', () => {
  test('valid rectangle parses', () => {
    expect(RectangleScheme.parse(validRectangle)).toEqual(validRectangle);
  });

  test('string value throws', () => {
    const invalid = { ...validRectangle, x: '0' };
    expect(() => RectangleScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws', () => {
    const invalid = { ...validRectangle, extra: true };
    expect(() => RectangleScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('SessionTabScheme', () => {
  test('valid session tab parses', () => {
    expect(SessionTabScheme.parse(validSessionTab)).toEqual(validSessionTab);
  });

  test('missing required field throws', () => {
    const invalid = { ...validSessionTab };
    delete (invalid as Record<string, unknown>).partitionId;
    expect(() => SessionTabScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws', () => {
    const invalid = { ...validSessionTab, extra: true };
    expect(() => SessionTabScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('SessionTabContainerScheme', () => {
  test('valid session tab container parses', () => {
    expect(SessionTabContainerScheme.parse(validSessionTabContainer)).toEqual(
      validSessionTabContainer,
    );
  });

  test('empty tabs array is valid', () => {
    const container = { ...validSessionTabContainer, tabs: [] };
    const result = SessionTabContainerScheme.parse(container);
    expect(result.tabs).toEqual([]);
  });

  test('extra property throws', () => {
    const invalid = { ...validSessionTabContainer, extra: true };
    expect(() => SessionTabContainerScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('SessionDesktopScheme', () => {
  test('valid session desktop parses', () => {
    const result = SessionDesktopScheme.parse(validSessionDesktop);
    expect(result).toEqual(validSessionDesktop);
  });

  test('empty tabContainers array is valid', () => {
    const desktop = { ...validSessionDesktop, tabContainers: [] };
    const result = SessionDesktopScheme.parse(desktop);
    expect(result.tabContainers).toEqual([]);
  });

  test('legacy "name" field migrates to shortName and longName', () => {
    const legacy = { ...validSessionDesktop, name: 'Work' };
    delete (legacy as Record<string, unknown>).shortName;
    delete (legacy as Record<string, unknown>).longName;
    const result = SessionDesktopScheme.parse(legacy);
    expect(result.shortName).toBe('Work');
    expect(result.longName).toBe('Work');
    expect((result as Record<string, unknown>).name).toBeUndefined();
  });

  test('legacy "name: null" migrates to both fields null', () => {
    const legacy = { ...validSessionDesktop, name: null };
    delete (legacy as Record<string, unknown>).shortName;
    delete (legacy as Record<string, unknown>).longName;
    const result = SessionDesktopScheme.parse(legacy);
    expect(result.shortName).toBeNull();
    expect(result.longName).toBeNull();
    expect((result as Record<string, unknown>).name).toBeUndefined();
  });

  test('new shortName/longName takes precedence over legacy name', () => {
    const mixed = { ...validSessionDesktop, name: 'Old', shortName: 'New', longName: 'Full Name' };
    const result = SessionDesktopScheme.parse(mixed);
    expect(result.shortName).toBe('New');
    expect(result.longName).toBe('Full Name');
    expect((result as Record<string, unknown>).name).toBeUndefined();
  });

  test('new shortName only: longName falls back to null when no legacy name', () => {
    const partial = { ...validSessionDesktop, shortName: 'W' };
    delete (partial as Record<string, unknown>).longName;
    delete (partial as Record<string, unknown>).name;
    const result = SessionDesktopScheme.parse(partial);
    expect(result.shortName).toBe('W');
    expect(result.longName).toBeNull();
  });

  test('new longName only: shortName falls back to null when no legacy name', () => {
    const partial = { ...validSessionDesktop, longName: 'Full Name' };
    delete (partial as Record<string, unknown>).shortName;
    delete (partial as Record<string, unknown>).name;
    const result = SessionDesktopScheme.parse(partial);
    expect(result.shortName).toBeNull();
    expect(result.longName).toBe('Full Name');
  });

  test('new shortName + legacy name: longName uses legacy name as fallback', () => {
    const mixed = { ...validSessionDesktop, name: 'Old', shortName: 'New' };
    delete (mixed as Record<string, unknown>).longName;
    const result = SessionDesktopScheme.parse(mixed);
    expect(result.shortName).toBe('New');
    expect(result.longName).toBe('Old');
  });

  test('new longName + legacy name: shortName uses legacy name as fallback', () => {
    const mixed = { ...validSessionDesktop, name: 'Old', longName: 'Full Name' };
    delete (mixed as Record<string, unknown>).shortName;
    const result = SessionDesktopScheme.parse(mixed);
    expect(result.shortName).toBe('Old');
    expect(result.longName).toBe('Full Name');
  });

  test('empty string shortName falls back to legacy name (parity with Desktop.setName)', () => {
    const mixed = { ...validSessionDesktop, name: 'Work', shortName: '' };
    delete (mixed as Record<string, unknown>).longName;
    const result = SessionDesktopScheme.parse(mixed);
    expect(result.shortName).toBe('Work');
    expect(result.longName).toBe('Work');
  });

  test('empty string longName falls back to legacy name (parity with Desktop.setName)', () => {
    const mixed = { ...validSessionDesktop, name: 'Work', longName: '' };
    delete (mixed as Record<string, unknown>).shortName;
    const result = SessionDesktopScheme.parse(mixed);
    expect(result.shortName).toBe('Work');
    expect(result.longName).toBe('Work');
  });
});

describe('SessionWindowScheme', () => {
  test('valid session window parses', () => {
    expect(SessionWindowScheme.parse(validSessionWindow)).toEqual(validSessionWindow);
  });

  test('missing required field throws', () => {
    const invalid = { ...validSessionWindow };
    delete (invalid as Record<string, unknown>).bounds;
    expect(() => SessionWindowScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws', () => {
    const invalid = { ...validSessionWindow, extra: true };
    expect(() => SessionWindowScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('SessionStoreScheme', () => {
  test('valid session store with empty windows parses', () => {
    const store = { windows: [] };
    const result = SessionStoreScheme.parse(store);
    expect(result.windows).toEqual([]);
  });

  test('valid session store with data parses', () => {
    expect(SessionStoreScheme.parse(validSessionStore)).toEqual(validSessionStore);
  });

  test('missing required field throws', () => {
    const invalid = {};
    expect(() => SessionStoreScheme.parse(invalid)).toThrow(ZodError);
  });

  test('extra property throws', () => {
    const invalid = { ...validSessionStore, extra: true };
    expect(() => SessionStoreScheme.parse(invalid)).toThrow(ZodError);
  });

  test('invalid window child throws', () => {
    const invalid = {
      windows: [{ ...validSessionWindow, id: 'not-a-number' }],
    };
    expect(() => SessionStoreScheme.parse(invalid)).toThrow(ZodError);
  });
});
