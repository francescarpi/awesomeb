import { TSearchEngineCode, ITarget, TPartitionId } from '~/types';
import {
  config,
  Browser,
  defaultPartition,
  getPartitions,
  TabContainer,
  Partition,
  getNextPreviousBounds,
} from '@/core';
import { HandlerDetails, WindowOpenHandlerResponse, Notification } from 'electron';
import log from 'electron-log';

const scopeLog = log.scope('BrowserHelper');

export function parseQuery(query: string, searchEngineCode?: TSearchEngineCode): string | null {
  const { valid, url } = isValidUrl(query);
  let parsedURL: string = url;

  if (!valid) {
    const engines = config.getProperty('searchEngines');
    const engine = searchEngineCode
      ? engines.find((se) => se.code === searchEngineCode)
      : config.defaultSearchEngine;

    if (!engine) {
      return null;
    }

    parsedURL = engine.url.replace('{query}', encodeURIComponent(query.trim()));
  }

  return parsedURL;
}

export function isValidUrl(url: string): { valid: boolean; url: string } {
  if (!url) {
    return { valid: false, url };
  }

  // If url does not start with http or https, we are going to add it, but only if seems to be a real url.
  // It means, the url ends with .com, .net, .org, etc.
  if (
    !url.startsWith('http://') &&
    !url.startsWith('https://') &&
    url.match(/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/)
  ) {
    url = `https://${url}`;
  }

  try {
    const parsedUrl = new URL(url);
    return { valid: true, url: parsedUrl.toString() };
  } catch {
    return { valid: false, url };
  }
}

export function parseTarget(
  browser: Browser,
  props?: { targetId?: string; partitionId?: TPartitionId; tabContainer?: TabContainer },
): ITarget | null {
  const targetId = props?.targetId || 'current-desktop-window';
  const partitionId = props?.partitionId;

  let window = browser.activeWindow;
  if (!window) {
    scopeLog.error('No active window found for targetId "current-desktop-window"');
    return null;
  }

  if (targetId.startsWith('window-')) {
    const targetWindowId = Number(targetId.replace('window-', ''));
    const targetWindow = browser.getWindow(targetWindowId);
    if (!targetWindow) {
      return null;
    }
    window = targetWindow;
  }

  if (targetId === 'new-window') {
    window = browser.createWindow(browser.idGenerator.nextWindowId, { bounds: window.bounds });
    scopeLog.info(
      `Created new window with id ${window.id}, default desktop is ${window.selectedDesktop.id}`,
    );
  } else if (targetId === 'new-window-left') {
    const bounds = getNextPreviousBounds(browser, 'previous') || undefined;
    window = browser.createWindow(browser.idGenerator.nextWindowId, { bounds });
  } else if (targetId === 'new-window-right') {
    const bounds = getNextPreviousBounds(browser, 'next') || undefined;
    window = browser.createWindow(browser.idGenerator.nextWindowId, { bounds });
  }

  let desktop = window.selectedDesktop;
  if (targetId.startsWith('desktop-')) {
    const desktopId = Number(targetId.replace('desktop-', ''));
    const targetDesktop = window.getDesktop(desktopId);
    if (!targetDesktop) {
      scopeLog.error(
        `No desktop found with id ${desktopId} in window ${window.id} for targetId "${targetId}"`,
      );
      return null;
    }
    desktop = targetDesktop;
  }

  const { selectedTab } = desktop;
  let tabContainer: TabContainer;
  if (targetId === 'selected-tab-container' && selectedTab) {
    tabContainer = selectedTab.tabContainer;
  } else if (props?.tabContainer) {
    tabContainer = props.tabContainer;
  } else {
    tabContainer = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
  }

  let partition: Partition;
  if (selectedTab) {
    partition = selectedTab.tab.partition;
  } else if (partitionId) {
    const partitions = getPartitions();
    partition = partitions.get(partitionId) || defaultPartition;
  } else {
    partition = defaultPartition;
  }

  return { window, desktop, tabContainer, partition };
}

export function windowOpenHadler(
  browser: Browser,
  details: HandlerDetails,
): WindowOpenHandlerResponse {
  const { url, disposition, features } = details;

  scopeLog.info(`Url open handler for tab. URL: "${url}", Disposition: "${disposition}"`);

  const isPopup =
    disposition === 'new-window' && (features.includes('width=') || features.includes('height='));

  scopeLog.info(`Is popup: ${isPopup}`);

  if (isPopup) {
    scopeLog.info('Opening URL in a popup window');
    return { action: 'allow' };
  }

  if (disposition === 'foreground-tab') {
    browser.openURL(url, { targetId: 'current-desktop-window', selectTab: true });
    return { action: 'deny' };
  }

  if (disposition === 'background-tab') {
    browser.openURL(url, { targetId: 'current-desktop-window' });
    return { action: 'deny' };
  }

  if (disposition === 'new-window') {
    browser.openURL(url, { targetId: 'new-window' });
    return { action: 'deny' };
  }

  return { action: 'deny' };
}

export function notification(title: string, body: string) {
  new Notification({ title, body }).show();
}
