import { Browser, Window } from '@/core';
import { tabToChromeTab } from './helpers';
import { TExtensionId, TPartitionId, TTabId } from '~/types';
import { ITabUpdate } from './types';
import log from 'electron-log';

const scopeLog = log.scope('ChromeTabs');

const supportedTabURLProtocols = new Set([
  'http:',
  'https:',
  'file:',
  'about:',
  'ab:',
  'chrome-extension:',
]);

export function buildTabURL(
  extensionId: TExtensionId,
  url: string | undefined,
  partitionId: TPartitionId,
  windowId: number,
): string | null {
  const extensionURL = new URL(`chrome-extension://${extensionId}/`);

  let parsedURL: URL;
  try {
    parsedURL = new URL(url ?? '', extensionURL);
  } catch {
    return null;
  }

  if (!supportedTabURLProtocols.has(parsedURL.protocol)) {
    return null;
  }

  parsedURL.searchParams.set('partitionId', partitionId);
  parsedURL.searchParams.set('winId', String(windowId));
  return parsedURL.toString();
}

export class ChromeTabs {
  constructor(private readonly _browser: Browser) {}

  async query(
    window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: chrome.tabs.QueryInfo,
  ): Promise<chrome.tabs.Tab[]> {
    const tabs = props.currentWindow ? window.tabs : this._browser.tabs;
    const selectedTab = window.selectedTab;

    if (!tabs) {
      return [];
    }

    let response = tabs.map((tabData, idx) =>
      tabToChromeTab(window, tabData, idx, tabData.tab.id === selectedTab?.tab.id),
    );

    if (props.active) {
      response = response.filter((t) => t.active);
    }

    return response;
  }

  async create(
    window: Window,
    partitionId: TPartitionId,
    extensionId: TExtensionId,
    props: chrome.tabs.CreateProperties,
  ): Promise<chrome.tabs.Tab | undefined> {
    const selectedTab = window.selectedTab;
    if (!selectedTab) {
      scopeLog.warn('No selected tab found in focused window for creating a new tab');
      return undefined;
    }

    const url = buildTabURL(extensionId, props.url, partitionId, window.id);
    if (!url) {
      scopeLog.warn('Unsupported or invalid tab URL:', props.url);
      return undefined;
    }

    const response = await this._browser.openURL(url, {
      partitionId,
      selectTab: true,
    });

    if (!response) {
      scopeLog.warn('Failed to create a new tab with url:', url);
      return undefined;
    }

    this._browser.extensions.closePopup(window);

    return tabToChromeTab(
      window,
      { desktop: selectedTab.desktop, tabContainer: response.tabContainer, tab: response.tab },
      window.tabs.length - 1,
      false,
    );
  }

  async update(
    window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: ITabUpdate,
  ) {
    if (props.active) {
      this._browser.extensions.closePopup(window);
      window.selectTab(props.tabId);
    }
  }

  async reload(
    window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    props: { tabData?: TTabId | chrome.tabs.ReloadProperties },
  ): Promise<void> {
    const tab =
      props.tabData && typeof props.tabData === 'number'
        ? window.getTab(props.tabData)
        : window.selectedTab;

    if (!tab) {
      scopeLog.warn(`No tab found  for updating`);
      return;
    }

    tab.tab.reload();
  }
}
