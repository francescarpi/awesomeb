import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { Permissions } from './permissions';
import { userDataPath } from '@/paths';
import fs from 'fs';
import path from 'path';

// Helper to get the permissions file path (must match electron-store's naming)
function getPermissionsFilePath() {
  return path.join(userDataPath(), 'permissions.json');
}

// Helper to clean up permissions file between tests
function cleanPermissionsFile() {
  const filePath = getPermissionsFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('Permissions', () => {
  beforeEach(() => {
    cleanPermissionsFile();
  });

  afterEach(() => {
    cleanPermissionsFile();
  });

  test('constructor succeeds with valid defaults', () => {
    const permissions = new Permissions();
    expect(permissions).toBeDefined();
    expect(permissions.all).toEqual({});
  });

  test('constructor with corrupted disk falls back to defaults', () => {
    const filePath = getPermissionsFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        permissions: 'not-an-object',
      }),
    );

    const permissions = new Permissions();
    expect(permissions).toBeDefined();
    expect(permissions.all).toEqual({});
  });

  test('set() persists permission', () => {
    const permissions = new Permissions();
    permissions.set('example.com', 'notifications', true);

    expect(permissions.get('example.com', 'notifications')).toBe(true);
  });

  test('get() retrieves correct value (true/false/null)', () => {
    const permissions = new Permissions();
    permissions.set('example.com', 'notifications', true);
    permissions.set('example.com', 'camera', false);

    expect(permissions.get('example.com', 'notifications')).toBe(true);
    expect(permissions.get('example.com', 'camera')).toBe(false);
    expect(permissions.get('example.com', 'microphone')).toBeNull();
    expect(permissions.get('unknown.com', 'notifications')).toBeNull();
  });

  test('deleteHost() removes host permissions', () => {
    const permissions = new Permissions();
    permissions.set('example.com', 'notifications', true);
    permissions.set('test.com', 'camera', true);

    permissions.deleteHost('example.com');

    expect(permissions.get('example.com', 'notifications')).toBeNull();
    expect(permissions.get('test.com', 'camera')).toBe(true);
  });

  test('saveAll() replaces all permissions', () => {
    const permissions = new Permissions();
    permissions.set('example.com', 'notifications', true);

    permissions.saveAll({
      'new.com': { microphone: false },
    });

    expect(permissions.get('example.com', 'notifications')).toBeNull();
    expect(permissions.get('new.com', 'microphone')).toBe(false);
  });

  test('all getter returns all permissions', () => {
    const permissions = new Permissions();
    permissions.set('example.com', 'notifications', true);
    permissions.set('test.com', 'camera', false);

    const all = permissions.all;
    expect(all).toEqual({
      'example.com': { notifications: true },
      'test.com': { camera: false },
    });
  });

  test('permissions for different hosts do not interfere', () => {
    const permissions = new Permissions();
    permissions.set('host-a.com', 'notifications', true);
    permissions.set('host-b.com', 'notifications', false);
    permissions.set('host-a.com', 'camera', true);

    expect(permissions.get('host-a.com', 'notifications')).toBe(true);
    expect(permissions.get('host-b.com', 'notifications')).toBe(false);
    expect(permissions.get('host-a.com', 'camera')).toBe(true);
    expect(permissions.get('host-b.com', 'camera')).toBeNull();
  });
});
