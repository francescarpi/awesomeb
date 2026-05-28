import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { ClosedHistory } from './closed-history';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';

// Helper to get the closed-history file path (must match electron-store's naming)
function getClosedHistoryFilePath() {
  return path.join(userDataPath(), 'closed-history.json');
}

// Helper to clean up closed-history file between tests
function cleanClosedHistoryFile() {
  const filePath = getClosedHistoryFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('ClosedHistory', () => {
  beforeEach(() => {
    cleanClosedHistoryFile();
  });

  afterEach(() => {
    cleanClosedHistoryFile();
  });

  test('constructor succeeds with valid defaults', () => {
    const history = new ClosedHistory();
    expect(history).toBeDefined();
    expect(history.tabs).toEqual([]);
  });

  test('constructor with corrupted disk falls back to defaults', () => {
    const filePath = getClosedHistoryFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        tabs: 'not-an-array',
      }),
    );

    const history = new ClosedHistory();
    expect(history).toBeDefined();
    expect(history.tabs).toEqual([]);
  });

  test('tabs getter validates on read', () => {
    const history = new ClosedHistory();
    const data = history.tabs;
    expect(data).toEqual([]);
  });

  test('addTab adds valid tab', () => {
    const history = new ClosedHistory();
    history.addTab('Google', 'https://google.com');
    expect(history.tabs.length).toBe(1);
    expect(history.tabs[0].title).toBe('Google');
    expect(history.tabs[0].url).toBe('https://google.com');
  });

  test('addTab avoids duplicate URLs', () => {
    const history = new ClosedHistory();
    history.addTab('Google', 'https://google.com');
    history.addTab('Google Again', 'https://google.com');
    expect(history.tabs.length).toBe(1);
    expect(history.tabs[0].title).toBe('Google');
  });

  test('mostRecentTab returns latest', () => {
    const history = new ClosedHistory();
    history.addTab('First', 'https://first.com');
    history.addTab('Second', 'https://second.com');

    const mostRecent = history.mostRecentTab;
    expect(mostRecent).not.toBeNull();
    expect(mostRecent?.title).toBe('Second');
    expect(mostRecent?.url).toBe('https://second.com');
  });

  test('clear empties store', () => {
    const history = new ClosedHistory();
    history.addTab('Test', 'https://test.com');
    expect(history.tabs.length).toBe(1);

    history.clear();
    expect(history.tabs).toEqual([]);
  });

  test('addTab with duplicate URL is ignored', () => {
    const history = new ClosedHistory();
    history.addTab('Original', 'https://example.com');
    history.addTab('Duplicate', 'https://example.com');
    expect(history.tabs.length).toBe(1);
    expect(history.tabs[0].title).toBe('Original');
  });
});
