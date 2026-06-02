import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { ClosedTabs } from './closed-tabs';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';

// Helper to get the closed-tabs file path (must match electron-store's naming)
function getClosedTabsFilePath() {
  return path.join(userDataPath(), 'closed-tabs.json');
}

// Helper to clean up closed-tabs file between tests
function cleanClosedTabsFile() {
  const filePath = getClosedTabsFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('ClosedTabs', () => {
  beforeEach(() => {
    cleanClosedTabsFile();
  });

  afterEach(() => {
    cleanClosedTabsFile();
  });

  test('constructor succeeds with valid defaults', () => {
    const tabs = new ClosedTabs();
    expect(tabs).toBeDefined();
    expect(tabs.tabs).toEqual([]);
  });

  test('constructor with corrupted disk falls back to defaults', () => {
    const filePath = getClosedTabsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        tabs: 'not-an-array',
      }),
    );

    const tabs = new ClosedTabs();
    expect(tabs).toBeDefined();
    expect(tabs.tabs).toEqual([]);
  });

  test('tabs getter validates on read', () => {
    const tabs = new ClosedTabs();
    const data = tabs.tabs;
    expect(data).toEqual([]);
  });

  test('addTab adds valid tab', () => {
    const tabs = new ClosedTabs();
    tabs.addTab('Google', 'https://google.com');
    expect(tabs.tabs.length).toBe(1);
    expect(tabs.tabs[0].title).toBe('Google');
    expect(tabs.tabs[0].url).toBe('https://google.com');
  });

  test('addTab avoids duplicate URLs', () => {
    const tabs = new ClosedTabs();
    tabs.addTab('Google', 'https://google.com');
    tabs.addTab('Google Again', 'https://google.com');
    expect(tabs.tabs.length).toBe(1);
    expect(tabs.tabs[0].title).toBe('Google');
  });

  test('mostRecentTab returns latest', () => {
    const tabs = new ClosedTabs();
    tabs.addTab('First', 'https://first.com');
    tabs.addTab('Second', 'https://second.com');

    const mostRecent = tabs.mostRecentTab;
    expect(mostRecent).not.toBeNull();
    expect(mostRecent?.title).toBe('Second');
    expect(mostRecent?.url).toBe('https://second.com');
  });

  test('clear empties store', () => {
    const tabs = new ClosedTabs();
    tabs.addTab('Test', 'https://test.com');
    expect(tabs.tabs.length).toBe(1);

    tabs.clear();
    expect(tabs.tabs).toEqual([]);
  });

  test('addTab with duplicate URL is ignored', () => {
    const tabs = new ClosedTabs();
    tabs.addTab('Original', 'https://example.com');
    tabs.addTab('Duplicate', 'https://example.com');
    expect(tabs.tabs.length).toBe(1);
    expect(tabs.tabs[0].title).toBe('Original');
  });
});
