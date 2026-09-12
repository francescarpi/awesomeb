import { expect, test, describe, vi, afterEach } from 'vitest';
import { app } from 'electron';
import {
  sanitizeTag,
  parseTagFromArgv,
  parseTagFromEnv,
  resolveInstanceTag,
  userDataAppName,
  dataConfigFolderName,
  applyInstanceScope,
  INSTANCE_TAG_ENV,
} from '@/instance';
import path from 'path';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sanitizeTag', () => {
  test('accepts valid tags', () => {
    expect(sanitizeTag('dev')).toBe('dev');
    expect(sanitizeTag('prod')).toBe('prod');
    expect(sanitizeTag('work-1')).toBe('work-1');
    expect(sanitizeTag('  dev  ')).toBe('dev');
  });

  test('rejects empty, null and undefined', () => {
    expect(sanitizeTag(null)).toBeNull();
    expect(sanitizeTag(undefined)).toBeNull();
    expect(sanitizeTag('')).toBeNull();
    expect(sanitizeTag('   ')).toBeNull();
  });

  test('rejects path-injection attempts', () => {
    expect(sanitizeTag('..')).toBeNull();
    expect(sanitizeTag('../evil')).toBeNull();
    expect(sanitizeTag('a/b')).toBeNull();
    expect(sanitizeTag('a\\b')).toBeNull();
    expect(sanitizeTag('-dev')).toBeNull();
  });

  test('rejects invalid characters and oversized tags', () => {
    expect(sanitizeTag('dev prod')).toBeNull();
    expect(sanitizeTag('dev.prod')).toBeNull();
    expect(sanitizeTag('a'.repeat(33))).toBeNull();
    expect(sanitizeTag('a'.repeat(32))).toBe('a'.repeat(32));
  });
});

describe('parseTagFromArgv', () => {
  test('parses --instance-name=<tag>', () => {
    const argv = ['/electron', 'AwesomeB', '--instance-name=prod'];
    expect(parseTagFromArgv(argv)).toBe('prod');
  });

  test('parses --instance-name <tag>', () => {
    const argv = ['/electron', '--instance-name', 'dev', 'https://x.com'];
    expect(parseTagFromArgv(argv)).toBe('dev');
  });

  test('returns null when absent', () => {
    expect(parseTagFromArgv(['/electron', '--inspect=5858'])).toBeNull();
  });
});

describe('parseTagFromEnv', () => {
  test('reads the AB_INSTANCE_NAME env var', () => {
    expect(parseTagFromEnv({ [INSTANCE_TAG_ENV]: 'dev' })).toBe('dev');
  });

  test('returns null when unset', () => {
    expect(parseTagFromEnv({})).toBeNull();
  });
});

describe('resolveInstanceTag', () => {
  test('CLI wins over env', () => {
    const argv = ['--instance-name=cli'];
    const env = { [INSTANCE_TAG_ENV]: 'env' };
    expect(resolveInstanceTag(argv, env)).toBe('cli');
  });

  test('falls back to env when no CLI flag', () => {
    const env = { [INSTANCE_TAG_ENV]: 'env' };
    expect(resolveInstanceTag(['/electron'], env)).toBe('env');
  });

  test('returns null when neither is present', () => {
    expect(resolveInstanceTag(['/electron'], {})).toBeNull();
  });
});

describe('userDataAppName', () => {
  test('no tag -> AwesomeB', () => {
    expect(userDataAppName(null)).toBe('AwesomeB');
  });

  test('tagged -> AwesomeB <tag>', () => {
    expect(userDataAppName('dev')).toBe('AwesomeB dev');
    expect(userDataAppName('prod')).toBe('AwesomeB prod');
  });
});

describe('dataConfigFolderName', () => {
  test('no tag keeps release/dev split', () => {
    expect(dataConfigFolderName(null, false)).toBe('.awesomeb');
    expect(dataConfigFolderName(null, true)).toBe('.awesomeb.dev');
  });

  test('dev tag maps to the legacy dev folder', () => {
    expect(dataConfigFolderName('dev', false)).toBe('.awesomeb.dev');
    expect(dataConfigFolderName('dev', true)).toBe('.awesomeb.dev');
  });

  test('custom tags get their own folder', () => {
    expect(dataConfigFolderName('prod', false)).toBe('.awesomeb-prod');
    expect(dataConfigFolderName('prod', true)).toBe('.awesomeb-prod');
  });
});

describe('applyInstanceScope', () => {
  test('no tag is a no-op', () => {
    const spy = vi.spyOn(app, 'setPath');
    applyInstanceScope(null);
    expect(spy).not.toHaveBeenCalled();
  });

  test('tags scope userData and sessionData below the appData base', () => {
    const spy = vi.spyOn(app, 'setPath');

    // Mocked app.getPath returns /tmp/awesomeb for every key -> base is /tmp
    applyInstanceScope('dev');

    const scoped = path.join('/tmp', 'AwesomeB dev');
    expect(spy).toHaveBeenCalledWith('userData', scoped);
    expect(spy).toHaveBeenCalledWith('sessionData', scoped);
  });

  test('different tags map to different scopes', () => {
    const spy = vi.spyOn(app, 'setPath');

    applyInstanceScope('prod');
    expect(spy).toHaveBeenCalledWith('userData', path.join('/tmp', 'AwesomeB prod'));
  });
});
