import type { TTabId } from '~/types';

/**
 * Types for the automation API exposed to AI agents.
 *
 * The automation surface mirrors what an agent can observe and do over the Chrome
 * DevTools Protocol, but with stable identifiers, so it does not depend on the
 * positional (and unstable) `pageId` the DevTools MCP assigns to each page.
 */

export interface IAutomationTab {
  id: TTabId;
  title: string;
  url: string | null;
  suspended: boolean;
  selected: boolean;
  isInternal: boolean;
  desktopId: number;
}

export interface IAutomationContext {
  windowId: number;
  isWindowPage: boolean;
}

export interface IAutomationResult {
  ok: boolean;
  tab?: IAutomationTab;
  error?: string;
}
