import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { TabTags } from './tab-tags';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';

// Helper to get the tab-tags file path (must match electron-store's naming)
function getTabTagsFilePath() {
  return path.join(userDataPath(), 'tab-tags.json');
}

// Helper to clean up tab-tags file between tests
function cleanTabTagsFile() {
  const filePath = getTabTagsFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('TabTags', () => {
  beforeEach(() => {
    cleanTabTagsFile();
  });

  afterEach(() => {
    cleanTabTagsFile();
  });

  test('constructor with valid defaults succeeds', () => {
    const tabTags = new TabTags();
    expect(tabTags).toBeDefined();
    expect(tabTags.get(1)).toEqual([]);
  });

  test('constructor with corrupted disk falls back to defaults', () => {
    const filePath = getTabTagsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        tabTags: 'not-an-object',
      }),
    );

    const tabTags = new TabTags();
    expect(tabTags).toBeDefined();
    expect(tabTags.get(1)).toEqual([]);
  });

  test('assign() adds the tag to the tab and persists it', () => {
    const tabTags = new TabTags();

    tabTags.assign(12, 'tag-1');

    expect(tabTags.get(12)).toEqual(['tag-1']);

    const tabTags2 = new TabTags();
    expect(tabTags2.get(12)).toEqual(['tag-1']);
  });

  test('assign() does not duplicate the same tag', () => {
    const tabTags = new TabTags();

    tabTags.assign(12, 'tag-1');
    tabTags.assign(12, 'tag-1');

    expect(tabTags.get(12)).toEqual(['tag-1']);
  });

  test('assign() keeps the tags of different tabs apart', () => {
    const tabTags = new TabTags();

    tabTags.assign(12, 'tag-1');
    tabTags.assign(13, 'tag-2');
    tabTags.assign(12, 'tag-3');

    expect(tabTags.get(12)).toEqual(['tag-1', 'tag-3']);
    expect(tabTags.get(13)).toEqual(['tag-2']);
  });

  test('unassign() removes the tag from the tab', () => {
    const tabTags = new TabTags();

    tabTags.assign(12, 'tag-1');
    tabTags.assign(12, 'tag-2');
    tabTags.unassign(12, 'tag-1');

    expect(tabTags.get(12)).toEqual(['tag-2']);
  });

  test('unassign() removes the tab entry when no tags are left', () => {
    const tabTags = new TabTags();

    tabTags.assign(12, 'tag-1');
    tabTags.unassign(12, 'tag-1');

    expect(tabTags.get(12)).toEqual([]);

    const tabTags2 = new TabTags();
    expect(tabTags2.get(12)).toEqual([]);
  });

  test('unassign() does nothing when the tab has no tags', () => {
    const tabTags = new TabTags();

    tabTags.unassign(12, 'tag-1');

    expect(tabTags.get(12)).toEqual([]);
  });

  test('get() returns an empty array for a tab without tags', () => {
    const tabTags = new TabTags();

    expect(tabTags.get(999)).toEqual([]);
  });

  test('removeTab() removes the entry of the tab', () => {
    const tabTags = new TabTags();

    tabTags.assign(12, 'tag-1');
    tabTags.assign(13, 'tag-2');
    tabTags.removeTab(12);

    expect(tabTags.get(12)).toEqual([]);
    expect(tabTags.get(13)).toEqual(['tag-2']);
  });

  test('removeTab() does nothing when the tab has no entry', () => {
    const tabTags = new TabTags();

    tabTags.removeTab(999);

    expect(tabTags.get(999)).toEqual([]);
  });

  test('removeTag() removes the tag from every tab', () => {
    const tabTags = new TabTags();

    tabTags.assign(12, 'tag-1');
    tabTags.assign(12, 'tag-2');
    tabTags.assign(13, 'tag-1');
    tabTags.removeTag('tag-1');

    expect(tabTags.get(12)).toEqual(['tag-2']);
    expect(tabTags.get(13)).toEqual([]);
  });

  test('removeTag() does nothing when the tag is not assigned', () => {
    const tabTags = new TabTags();

    tabTags.assign(12, 'tag-1');
    tabTags.removeTag('tag-unknown');

    expect(tabTags.get(12)).toEqual(['tag-1']);
  });
});
