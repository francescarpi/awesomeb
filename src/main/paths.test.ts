import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { userDataPath } from '@/paths';
import { INSTANCE_TAG_ENV } from '@/instance';

const Env = process.env as Record<string, string | undefined>;

function setEnv(key: string, value: string | undefined) {
  Env[key] = value;
}

function clearEnv(key: string) {
  delete Env[key];
}

const SAVED_ENV: Record<string, string | undefined> = {};

function saveEnv(key: string) {
  SAVED_ENV[key] = Env[key];
}

function restoreEnv(key: string) {
  setEnv(key, SAVED_ENV[key]);
}

beforeEach(() => {
  saveEnv(INSTANCE_TAG_ENV);
  saveEnv('ELECTRON_RENDERER_URL');
  clearEnv(INSTANCE_TAG_ENV);
  clearEnv('ELECTRON_RENDERER_URL');
});

afterEach(() => {
  restoreEnv(INSTANCE_TAG_ENV);
  restoreEnv('ELECTRON_RENDERER_URL');
});

describe('userDataPath with instance tags', () => {
  test('no tag + release -> .awesomeb under /tmp with pid isolation', () => {
    const p = userDataPath();
    expect(p).toBe(`/tmp/.awesomeb/${process.pid}`);
  });

  test('AB_INSTANCE_NAME=dev -> legacy dev folder', () => {
    setEnv(INSTANCE_TAG_ENV, 'dev');
    expect(userDataPath()).toBe(`/tmp/.awesomeb.dev/${process.pid}`);
  });

  test('custom tag -> .awesomeb-<tag>', () => {
    setEnv(INSTANCE_TAG_ENV, 'prod');
    expect(userDataPath()).toBe(`/tmp/.awesomeb-prod/${process.pid}`);
  });

  test('ELECTRON_RENDERER_URL (dev mode) without tag -> legacy dev folder', () => {
    setEnv('ELECTRON_RENDERER_URL', 'http://localhost:4321');
    expect(userDataPath()).toBe(`/tmp/.awesomeb.dev/${process.pid}`);
  });

  test('invalid tag falls back to the base folder', () => {
    setEnv(INSTANCE_TAG_ENV, '../evil');
    expect(userDataPath()).toBe(`/tmp/.awesomeb/${process.pid}`);
  });

  test('dev mode with custom tag -> .awesomeb-<tag>', () => {
    setEnv('ELECTRON_RENDERER_URL', 'http://localhost:4321');
    setEnv(INSTANCE_TAG_ENV, 'work');
    expect(userDataPath()).toBe(`/tmp/.awesomeb-work/${process.pid}`);
  });
});
