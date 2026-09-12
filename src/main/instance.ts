import path from 'path';
import { app } from 'electron';

/**
 * Instance tagging.
 *
 * Allows running multiple AwesomeB instances side by side by tagging them with
 * a name (e.g. "dev", "prod"). The tag scopes BOTH:
 *
 *  1. Electron's single-instance lock, by deriving a per-tag userData path
 *     (Electron scopes the lock to `app.getPath('userData')`).
 *  2. The app's own data folder (`~/.awesomeb*`), so stores don't collide.
 *
 * The tag comes from either `--instance-name=<tag>` (CLI) or the
 * `AB_INSTANCE_NAME` environment variable. CLI wins over env.
 */

export const INSTANCE_TAG_ENV = 'AB_INSTANCE_NAME';

/** Tag every dev build gets by default (set by scripts/dev.mjs). */
export const DEFAULT_INSTANCE_TAG = 'dev';

export const MAX_INSTANCE_TAG_LENGTH = 32;

const TAG_PATTERN = /^[A-Za-z0-9_-]+$/;
const FLAG_EQUALS = '--instance-name=';
const FLAG_SPACE = '--instance-name';

export function sanitizeTag(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.startsWith('-')) return null;
  if (trimmed.includes('..')) return null;
  if (trimmed.length > MAX_INSTANCE_TAG_LENGTH) return null;
  if (!TAG_PATTERN.test(trimmed)) return null;

  return trimmed;
}

export function parseTagFromArgv(argv: string[]): string | null {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith(FLAG_EQUALS)) {
      return sanitizeTag(arg.slice(FLAG_EQUALS.length));
    }

    if (arg === FLAG_SPACE) {
      return sanitizeTag(argv[i + 1]);
    }
  }

  return null;
}

export function parseTagFromEnv(env: NodeJS.ProcessEnv): string | null {
  return sanitizeTag(env[INSTANCE_TAG_ENV]);
}

export function resolveInstanceTag(argv: string[], env: NodeJS.ProcessEnv): string | null {
  return parseTagFromArgv(argv) ?? parseTagFromEnv(env);
}

/**
 * Leaf name of the Electron userData folder that scopes the single-instance
 * lock. Same tag => same folder => same lock.
 */
export function userDataAppName(tag: string | null): string {
  return tag ? `AwesomeB ${tag}` : 'AwesomeB';
}

/**
 * Leaf name of the app's own data folder (`~/.awesomeb*`). The `dev` tag maps
 * to the legacy `.awesomeb.dev` folder so existing dev stores are preserved.
 */
export function dataConfigFolderName(tag: string | null, isDev: boolean): string {
  if (!tag) return isDev ? '.awesomeb.dev' : '.awesomeb';
  if (tag === DEFAULT_INSTANCE_TAG) return '.awesomeb.dev';
  return `.awesomeb-${tag}`;
}

/**
 * Scopes Electron's userData (and sessionData, which defaults to userData) to
 * the given tag's folder. Must run BEFORE `app.requestSingleInstanceLock()`
 * so the lock is keyed per tag. No-op when there is no tag.
 */
export function applyInstanceScope(tag: string | null): void {
  if (!tag) return;

  const base = path.dirname(app.getPath('userData'));
  const scoped = path.join(base, userDataAppName(tag));

  app.setPath('userData', scoped);
  app.setPath('sessionData', scoped);
}
