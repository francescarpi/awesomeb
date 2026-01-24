import { expect, test } from 'vitest';
import { Browser, Session } from '@main/core';

test('session data structure should match expected format', () => {
  const browser = new Browser();
  const w = browser.createWindow();
  const session = new Session(browser);

  expect(session.sessionToStore()).toEqual([
    {
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
          theme: 'blue',
        },
        {
          id: 2,
          name: null,
          theme: 'blue',
        },
        {
          id: 3,
          name: null,
          theme: 'blue',
        },
        {
          id: 4,
          name: null,
          theme: 'blue',
        },
        {
          id: 5,
          name: null,
          theme: 'blue',
        },
      ],
      selectedDesktopId: 1,
      sidebarCollapsed: false,
    },
  ]);
});
