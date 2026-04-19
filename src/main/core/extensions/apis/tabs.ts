import { Browser, Window } from '@/core';
import { tabToChromeTab } from './helpers';
import { TExtensionId, TPartitionId, TTabId } from '~/types';
import { ITabUpdate } from './types';
import log from 'electron-log';

const scopeLog = log.scope('ChromeTabs');

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

    const response = tabs.map((tabData, idx) =>
      tabToChromeTab(window, tabData, idx, tabData.tab.id === selectedTab?.tab.id),
    );

    return response;
  }

  async create(
    window: Window,
    _partitionId: TPartitionId,
    extensionId: TExtensionId,
    props: chrome.tabs.CreateProperties,
  ): Promise<chrome.tabs.Tab | undefined> {
    const selectedTab = window.selectedTab;
    if (!selectedTab) {
      scopeLog.warn('No selected tab found in focused window for creating a new tab');
      return undefined;
    }

    const url = `chrome-extension://${extensionId}/${props.url}`;
    const response = await this._browser.openURL(url, {
      partitionId: selectedTab.tab.partition.id,
      selectTab: true,
    });

    if (!response) {
      scopeLog.warn('Failed to create a new tab with url:', url);
      return undefined;
    }

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
