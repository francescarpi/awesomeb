import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { VisitHistory } from './visit-history';
import { ZodError } from 'zod';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';

// Helper to get the visit-history file path (must match electron-store's naming)
function getVisitHistoryFilePath() {
  return path.join(userDataPath(), 'visit-history.json');
}

// Helper to clean up visit-history file between tests
function cleanVisitHistoryFile() {
  const filePath = getVisitHistoryFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('VisitHistory', () => {
  beforeEach(() => {
    cleanVisitHistoryFile();
  });

  afterEach(() => {
    cleanVisitHistoryFile();
  });

  test('constructor with valid defaults succeeds', () => {
    const vh = new VisitHistory();
    expect(vh).toBeDefined();
    expect(vh.getAll()).toEqual([]);
  });

  test('constructor with corrupted disk JSON throws ZodError', () => {
    const filePath = getVisitHistoryFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        history: 'not-an-array',
      }),
    );

    expect(() => new VisitHistory()).toThrow(ZodError);
  });

  test('addUrl() creates new HistoryItem', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://example.com', title: 'Example' });

    const all = vh.getAll();
    expect(all.length).toBe(1);
    expect(all[0].url).toBe('https://example.com');
    expect(all[0].id).toBe('https://example.com');
    expect(all[0].visitCount).toBe(1);
    expect(all[0].visits.length).toBe(1);
  });

  test('addUrl() increments visitCount for existing URL', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://example.com' });
    vh.addUrl({ url: 'https://example.com' });

    const all = vh.getAll();
    expect(all.length).toBe(1);
    expect(all[0].visitCount).toBe(2);
    expect(all[0].visits.length).toBe(2);
  });

  test('addUrl() updates title and lastVisitTime', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://example.com', title: 'Old Title' });

    // Small delay to ensure time changes
    const afterFirst = Date.now();
    vh.addUrl({ url: 'https://example.com', title: 'New Title' });
    const afterSecond = Date.now();

    const all = vh.getAll();
    expect(all[0].title).toBe('New Title');
    expect(all[0].lastVisitTime).toBeGreaterThanOrEqual(afterFirst);
    expect(all[0].lastVisitTime).toBeLessThanOrEqual(afterSecond);
  });

  test('search() full-text by url', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://github.com', title: 'GitHub' });
    vh.addUrl({ url: 'https://example.com', title: 'Example' });

    const results = vh.queryHistory({ text: 'github' });
    expect(results.length).toBe(1);
    expect(results[0].url).toBe('https://github.com');
  });

  test('queryHistory() full-text by title', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://github.com', title: 'GitHub' });
    vh.addUrl({ url: 'https://example.com', title: 'Example' });

    const results = vh.queryHistory({ text: 'example' });
    expect(results.length).toBe(1);
    expect(results[0].url).toBe('https://example.com');
  });

  test('queryHistory() with startTime/endTime filter', () => {
    const vh = new VisitHistory();
    const now = Date.now();

    vh.addUrl({ url: 'https://old.com' });

    // Manually manipulate visit time to be old
    const filePath = getVisitHistoryFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.history[0].lastVisitTime = now - 48 * 60 * 60 * 1000;
    data.history[0].visits[0].visitTime = now - 48 * 60 * 60 * 1000;
    fs.writeFileSync(filePath, JSON.stringify(data));

    vh.addUrl({ url: 'https://new.com' });

    const results = vh.queryHistory({ startTime: now - 24 * 60 * 60 * 1000 });
    expect(results.length).toBe(1);
    expect(results[0].url).toBe('https://new.com');
  });

  test('queryHistory() with maxResults limit', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://a.com' });
    vh.addUrl({ url: 'https://b.com' });
    vh.addUrl({ url: 'https://c.com' });

    const results = vh.queryHistory({ maxResults: 2 });
    expect(results.length).toBe(2);
  });

  test('queryHistory() default maxResults = 100', () => {
    const vh = new VisitHistory();
    for (let i = 0; i < 105; i++) {
      vh.addUrl({ url: `https://site-${i}.com` });
    }

    const results = vh.queryHistory({});
    expect(results.length).toBe(100);
  });

  test('getVisits() returns visits for URL sorted desc', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://example.com' });

    // Add second visit with delay
    vh.addUrl({ url: 'https://example.com' });

    const visits = vh.getVisits({ url: 'https://example.com' });
    expect(visits.length).toBe(2);
    expect(visits[0].visitTime).toBeGreaterThanOrEqual(visits[1].visitTime);
  });

  test('getVisits() returns empty array for unknown URL', () => {
    const vh = new VisitHistory();
    const visits = vh.getVisits({ url: 'https://unknown.com' });
    expect(visits).toEqual([]);
  });

  test('deleteUrl() removes HistoryItem', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://example.com' });
    vh.deleteUrl({ url: 'https://example.com' });

    expect(vh.getAll().length).toBe(0);
  });

  test('deleteRange() removes visits in range, removes empty HistoryItems', () => {
    const vh = new VisitHistory();
    const now = Date.now();

    vh.addUrl({ url: 'https://example.com' });
    vh.addUrl({ url: 'https://other.com' });

    // Manually set first visit to old time
    const filePath = getVisitHistoryFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const oldTime = now - 48 * 60 * 60 * 1000;
    data.history[0].lastVisitTime = oldTime;
    data.history[0].visits[0].visitTime = oldTime;
    fs.writeFileSync(filePath, JSON.stringify(data));

    vh.deleteRange({ startTime: now - 72 * 60 * 60 * 1000, endTime: now - 24 * 60 * 60 * 1000 });

    const all = vh.getAll();
    expect(all.length).toBe(1);
    expect(all[0].url).toBe('https://other.com');
  });

  test('deleteUrls() removes multiple HistoryItems', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://example.com' });
    vh.addUrl({ url: 'https://other.com' });
    vh.addUrl({ url: 'https://third.com' });

    vh.deleteUrls(['https://example.com', 'https://other.com']);

    const all = vh.getAll();
    expect(all.length).toBe(1);
    expect(all[0].url).toBe('https://third.com');
  });

  test('deleteUrls() ignores non-existent URLs', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://example.com' });

    vh.deleteUrls(['https://nonexistent.com', 'https://example.com']);

    expect(vh.getAll().length).toBe(0);
  });

  test('deleteAll() clears everything', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://example.com' });
    vh.addUrl({ url: 'https://other.com' });

    vh.deleteAll();
    expect(vh.getAll().length).toBe(0);
  });

  test('persistence: save with one instance, read with another', () => {
    const vh1 = new VisitHistory();
    vh1.addUrl({ url: 'https://example.com', title: 'Example' });

    const vh2 = new VisitHistory();
    const all = vh2.getAll();
    expect(all.length).toBe(1);
    expect(all[0].url).toBe('https://example.com');
    expect(all[0].title).toBe('Example');
  });

  test('invalid write throws ZodError', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://example.com' });

    // Corrupt the file manually to simulate invalid write state
    const filePath = getVisitHistoryFilePath();
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        history: [
          {
            id: 'bad',
            url: 'https://bad.com',
            // missing lastVisitTime, visitCount, visits
          },
        ],
      }),
    );

    expect(() => new VisitHistory()).toThrow(ZodError);
  });

  test('cleanup removes entries older than retention days', () => {
    const vh = new VisitHistory();
    const now = Date.now();

    // Add an entry with an old visit time
    vh.addUrl({ url: 'https://old.com', title: 'Old' });
    const filePath = getVisitHistoryFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.history[0].lastVisitTime = now - 8 * 24 * 60 * 60 * 1000;
    data.history[0].visits[0].visitTime = now - 8 * 24 * 60 * 60 * 1000;
    fs.writeFileSync(filePath, JSON.stringify(data));

    // Trigger cleanup with 7 days retention
    vh.cleanupOldEntries(7);

    const all = vh.getAll();
    expect(all.length).toBe(0);
  });

  test('cleanup keeps entries within retention days', () => {
    const vh = new VisitHistory();
    const now = Date.now();

    // Add an entry with a visit time 6 days ago
    vh.addUrl({ url: 'https://recent.com', title: 'Recent' });
    const filePath = getVisitHistoryFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.history[0].lastVisitTime = now - 6 * 24 * 60 * 60 * 1000;
    data.history[0].visits[0].visitTime = now - 6 * 24 * 60 * 60 * 1000;
    fs.writeFileSync(filePath, JSON.stringify(data));

    // Trigger cleanup with 7 days retention
    vh.cleanupOldEntries(7);

    const all = vh.getAll();
    expect(all.length).toBe(1);
    expect(all[0].url).toBe('https://recent.com');
  });

  test('cleanup respects custom retention days', () => {
    const vh = new VisitHistory();
    const now = Date.now();

    // Add an entry 15 days old
    vh.addUrl({ url: 'https://fifteen.com', title: 'Fifteen' });
    const filePath = getVisitHistoryFilePath();
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.history[0].lastVisitTime = now - 15 * 24 * 60 * 60 * 1000;
    data.history[0].visits[0].visitTime = now - 15 * 24 * 60 * 60 * 1000;
    fs.writeFileSync(filePath, JSON.stringify(data));

    // Trigger cleanup with 30 days retention
    vh.cleanupOldEntries(30);

    // With 30 days retention, 15-day-old entry should be kept
    const all = vh.getAll();
    expect(all.length).toBe(1);
    expect(all[0].url).toBe('https://fifteen.com');
  });

  test('autocompleteUrls() returns exact match with range', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://github.com', title: 'GitHub' });

    const results = vh.autocompleteUrls('github');
    expect(results.length).toBe(1);
    expect(results[0].value).toBe('https://github.com');
    expect(results[0].range).toEqual([[8, 14]]);
  });

  test('autocompleteUrls() supports wildcard patterns', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://foobar.com', title: 'Foo Bar' });

    const results = vh.autocompleteUrls('foo*bar');
    expect(results.length).toBe(1);
    expect(results[0].value).toBe('https://foobar.com');
  });

  test('autocompleteUrls() returns empty array for no matches', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://github.com', title: 'GitHub' });

    const results = vh.autocompleteUrls('nonexistent');
    expect(results).toEqual([]);
  });

  test('autocompleteUrls() respects limit', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://site-a.com' });
    vh.addUrl({ url: 'https://site-b.com' });
    vh.addUrl({ url: 'https://site-c.com' });

    const results = vh.autocompleteUrls('site', 2);
    expect(results.length).toBe(2);
  });

  test('autocompleteUrls() returns empty array for empty query', () => {
    const vh = new VisitHistory();
    vh.addUrl({ url: 'https://github.com' });

    const results = vh.autocompleteUrls('');
    expect(results).toEqual([]);
  });
});
