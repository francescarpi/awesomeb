import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { TabMarks } from './TabMarks';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';
import type { ITabMark } from './schemes';

// Helper to get the marks file path (must match electron-store's naming)
function getMarksFilePath() {
  return path.join(userDataPath(), 'marks.json');
}

// Helper to clean up marks file between tests
function cleanMarksFile() {
  const filePath = getMarksFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function createTestTabMark(partial?: Partial<ITabMark>): ITabMark {
  return {
    trigger: 'test-trigger',
    tabId: 42,
    title: 'Test Title',
    ...partial,
  };
}

describe('TabMarks', () => {
  beforeEach(() => {
    cleanMarksFile();
  });

  afterEach(() => {
    cleanMarksFile();
  });

  test('constructor with valid defaults succeeds', () => {
    const tabMarks = new TabMarks();
    expect(tabMarks).toBeDefined();
    expect(tabMarks.all).toEqual([]);
  });

  test('constructor with corrupted disk falls back to defaults', () => {
    const filePath = getMarksFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        marks: 'not-an-array',
      }),
    );

    const tabMarks = new TabMarks();
    expect(tabMarks).toBeDefined();
    expect(tabMarks.all).toEqual([]);
  });

  test('add() persists valid mark', () => {
    const tabMarks = new TabMarks();
    const mark = createTestTabMark({ trigger: 'trigger-1', tabId: 1, title: 'Title One' });
    tabMarks.add(mark.trigger, mark.tabId, mark.title);
    expect(tabMarks.all.length).toBe(1);
    expect(tabMarks.all[0]).toEqual(mark);
  });

  test('delete() removes mark by trigger', () => {
    const tabMarks = new TabMarks();
    tabMarks.add('trigger-1', 1, 'Title One');
    tabMarks.add('trigger-2', 2, 'Title Two');
    expect(tabMarks.all.length).toBe(2);

    tabMarks.delete('trigger-1');
    expect(tabMarks.all.length).toBe(1);
    expect(tabMarks.all[0].trigger).toBe('trigger-2');
  });

  test('deleteByTabId() removes marks by tabId', () => {
    const tabMarks = new TabMarks();
    tabMarks.add('trigger-1', 1, 'Title One');
    tabMarks.add('trigger-2', 2, 'Title Two');
    tabMarks.add('trigger-3', 1, 'Title Three');
    expect(tabMarks.all.length).toBe(3);

    tabMarks.deleteByTabId(1);
    expect(tabMarks.all.length).toBe(1);
    expect(tabMarks.all[0].trigger).toBe('trigger-2');
  });

  test('get() locates mark', () => {
    const tabMarks = new TabMarks();
    const mark = createTestTabMark({ trigger: 'trigger-1', tabId: 1, title: 'Title One' });
    tabMarks.add(mark.trigger, mark.tabId, mark.title);

    const found = tabMarks.get('trigger-1');
    expect(found).not.toBeNull();
    expect(found).toEqual(mark);

    const notFound = tabMarks.get('missing');
    expect(notFound).toBeNull();
  });

  test('all getter returns all marks', () => {
    const tabMarks = new TabMarks();
    tabMarks.add('a', 1, 'A');
    tabMarks.add('b', 2, 'B');

    const all = tabMarks.all;
    expect(all.length).toBe(2);
    expect(all[0].trigger).toBe('a');
    expect(all[1].trigger).toBe('b');
  });

  test('all getter validates on read', () => {
    const tabMarks = new TabMarks();
    tabMarks.add('a', 1, 'A');
    // Should not throw with valid data
    expect(() => tabMarks.all).not.toThrow();
  });

  test('deleteAll() clears all marks', () => {
    const tabMarks = new TabMarks();
    tabMarks.add('a', 1, 'A');
    tabMarks.add('b', 2, 'B');
    expect(tabMarks.all.length).toBe(2);

    tabMarks.deleteAll();
    expect(tabMarks.all.length).toBe(0);
  });

  test('get() validates on read', () => {
    const tabMarks = new TabMarks();
    tabMarks.add('a', 1, 'A');
    expect(() => tabMarks.get('a')).not.toThrow();
  });
});
