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
};

const validSessionTabContainer = {
  id: 1,
  divider: false,
  tabs: [validSessionTab],
};

const validSessionDesktop = {
  id: 1,
  name: null,
  theme: 'blue',
  tabContainers: [validSessionTabContainer],
};

const validSessionWindow = {
  id: 1,
  bounds: validRectangle,
  selectedDesktopId: 1,
  visibleDesktopsRange: [1, 5] as [number, number],
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
    expect(SessionDesktopScheme.parse(validSessionDesktop)).toEqual(validSessionDesktop);
  });

  test('empty tabContainers array is valid', () => {
    const desktop = { ...validSessionDesktop, tabContainers: [] };
    const result = SessionDesktopScheme.parse(desktop);
    expect(result.tabContainers).toEqual([]);
  });

  test('extra property throws', () => {
    const invalid = { ...validSessionDesktop, extra: true };
    expect(() => SessionDesktopScheme.parse(invalid)).toThrow(ZodError);
  });
});

describe('SessionWindowScheme', () => {
  test('valid session window parses', () => {
    expect(SessionWindowScheme.parse(validSessionWindow)).toEqual(validSessionWindow);
  });

  test('without visibleDesktopsRange is valid', () => {
    const window = { ...validSessionWindow };
    delete (window as Record<string, unknown>).visibleDesktopsRange;
    const result = SessionWindowScheme.parse(window);
    expect(result.visibleDesktopsRange).toBeUndefined();
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
