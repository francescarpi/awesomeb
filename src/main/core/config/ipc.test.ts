import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { Browser, partitions, config } from '@/core';
import { setupConfigIPC } from './ipc';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';

type InvokeHandler = (event: IpcMainInvokeEvent, args: Record<string, unknown>) => Promise<unknown>;

const handlers = new Map<string, InvokeHandler>();

const fakeEvent = { sender: { id: 1 } } as unknown as IpcMainInvokeEvent;

function getConfigFilePath() {
  return path.join(userDataPath(), 'config.json');
}

function cleanConfigFile() {
  const configPath = getConfigFilePath();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}

describe('Config IPC', () => {
  let browser: Browser;

  beforeEach(() => {
    cleanConfigFile();
    config.set('tags', []);

    browser = new Browser();
    partitions.init();
    browser.createWindow(1, { withDesktops: true });

    handlers.clear();

    vi.spyOn(ipcMain, 'handle').mockImplementation((channel: string, fn: InvokeHandler) => {
      handlers.set(channel, fn);
    });

    setupConfigIPC(browser);
  });

  afterEach(() => {
    config.set('tags', []);
    cleanConfigFile();
    vi.restoreAllMocks();
  });

  test('config:create-tag handler is registered as handler', () => {
    expect(handlers.has('config:create-tag')).toBe(true);
  });

  test('config:create-tag creates the tag and returns the final slug', async () => {
    const win = browser.getWindow(1)!;
    win.modal.open('create-tag');

    const handler = handlers.get('config:create-tag')!;
    const result = await handler(fakeEvent, {
      winId: 1,
      name: 'My Tag',
      color: '#ff0000',
    });

    expect(result).toEqual({ id: expect.any(String), color: '#ff0000', name: 'my-tag' });
    expect(config.getProperty('tags')).toEqual([
      { id: expect.any(String), color: '#ff0000', name: 'my-tag' },
    ]);
  });

  test('config:create-tag returns null and does not throw when the name is too short', async () => {
    const win = browser.getWindow(1)!;
    win.modal.open('create-tag');

    const handler = handlers.get('config:create-tag')!;
    const result = await handler(fakeEvent, {
      winId: 1,
      name: 'ab',
      color: '#ff0000',
    });

    expect(result).toBeNull();
    expect(config.getProperty('tags')).toEqual([]);
  });

  test('config:create-tag returns undefined when no modal is open', async () => {
    const handler = handlers.get('config:create-tag')!;
    const result = await handler(fakeEvent, {
      winId: 1,
      name: 'My Tag',
      color: '#ff0000',
    });

    expect(result).toBeUndefined();
    expect(config.getProperty('tags')).toEqual([]);
  });
});
