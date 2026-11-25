import { Browser, Window } from '@/core';
import { createHandler, windowChecker } from '@/utils';
import type { IpcMainInvokeEvent } from 'electron';
import type { TTabId } from '~/types';
import { findAutomationTab, isWindowPage, listAutomationTabs } from './helpers';
import type { IAutomationContext, IAutomationResult } from './types';

/**
 * Automation API for AI agents.
 *
 * Exposes a stable, discoverable surface over the app's own capabilities so an agent
 * driving the app over the Chrome DevTools Protocol does not have to rely on the
 * positional (and unstable) `pageId` the DevTools MCP assigns to each page.
 */

export function setupAutomationIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; event: IpcMainInvokeEvent }>(
    'automation:context',
    'handle',
    browser,
    [windowChecker],
    async ({ win, event }) => {
      return {
        windowId: win.id,
        isWindowPage: isWindowPage(event.sender.getURL()),
      } satisfies IAutomationContext;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'automation:list-tabs',
    'handle',
    browser,
    [windowChecker],
    async ({ win }) => {
      return listAutomationTabs(browser, win);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; tabId: TTabId }>(
    'automation:wake-tab',
    'handle',
    browser,
    [windowChecker],
    async ({ win, tabId }) => {
      if (!browser.getTab(tabId)) {
        return { ok: false, error: `Tab ${tabId} not found` } satisfies IAutomationResult;
      }

      await win.selectTab(tabId);

      const tab = findAutomationTab(browser, win, tabId);

      return tab
        ? ({ ok: true, tab } satisfies IAutomationResult)
        : ({ ok: false, error: `Tab ${tabId} not found` } satisfies IAutomationResult);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; url: string }>(
    'automation:open-tab',
    'handle',
    browser,
    [windowChecker],
    async ({ win, url }) => {
      const result = await browser.openURL(url, {
        selectTab: true,
      });

      if (!result) {
        return { ok: false, error: `Could not open ${url}` } satisfies IAutomationResult;
      }

      const tab = findAutomationTab(browser, win, result.tab.id);

      return tab
        ? ({ ok: true, tab } satisfies IAutomationResult)
        : ({ ok: false, error: `Tab ${result.tab.id} not found` } satisfies IAutomationResult);
    },
  );
}
