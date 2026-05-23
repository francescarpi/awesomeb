import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { History } from './history';
import { ZodError } from 'zod';
import { userDataPath } from '@/paths';
import path from 'path';
import fs from 'fs';

// Helper to get the history file path (must match electron-store's naming)
function getHistoryFilePath() {
  return path.join(userDataPath(), 'history.json');
}

// Helper to clean up history file between tests
function cleanHistoryFile() {
  const filePath = getHistoryFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('History', () => {
  beforeEach(() => {
    cleanHistoryFile();
  });

  afterEach(() => {
    cleanHistoryFile();
  });

  test('constructor succeeds with valid defaults', () => {
    const history = new History();
    expect(history).toBeDefined();
  });

  test('constructor with corrupted disk throws ZodError', () => {
    const filePath = getHistoryFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        tabs: 'not-an-object',
      }),
    );

    expect(() => new History()).toThrow(ZodError);
  });

  test('get() returns null for non-existent tab', () => {
    const history = new History();
    const result = history.get(999);
    expect(result).toBeNull();
  });

  test('delete() removes tab history', () => {
    const filePath = getHistoryFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        tabs: {
          1: { index: 0, entries: [{ title: 'Example', url: 'https://example.com' }] },
        },
      }),
    );

    const history = new History();
    expect(history.get(1)).not.toBeNull();

    history.delete(1);
    expect(history.get(1)).toBeNull();
  });

  test('clear() empties all history', () => {
    const filePath = getHistoryFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        tabs: {
          1: { index: 0, entries: [{ title: 'Example', url: 'https://example.com' }] },
        },
      }),
    );

    const history = new History();
    expect(history.get(1)).not.toBeNull();

    history.clear();
    expect(history.get(1)).toBeNull();
  });

  test('_store.set() rejects invalid data', () => {
    const filePath = getHistoryFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        tabs: { 1: { index: 'not-a-number', entries: [] } },
      }),
    );

    expect(() => new History()).toThrow(ZodError);
  });
});
