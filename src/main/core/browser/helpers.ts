import { TSearchEngineCode, ITarget, TPartitionId } from '~/types';
import { config, Browser, defaultPartition, getPartitions } from '@/core';

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
  props?: { targetId?: string; partitionId?: TPartitionId },
): ITarget | null {
  const targetId = props?.targetId;
  const partitionId = props?.partitionId;

  if (targetId === undefined || targetId === 'current-desktop-window') {
    const window = browser.activeWindow;
    if (!window) {
      return null;
    }

    const desktop = window.selectedDesktop;
    const tabContainer = desktop.createTabContainer(browser.idGenerator.nextTabContainerId);
    const selectedTab = desktop.selectedTab;

    let partition = defaultPartition;
    if (partitionId) {
      partition = getPartitions().get(partitionId) || defaultPartition;
    } else if (selectedTab) {
      partition = selectedTab.tab.partition;
    }

    return { window, desktop, tabContainer, partition };
  }

  return null;
}
