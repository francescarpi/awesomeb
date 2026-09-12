import path from 'path';
import os from 'os';
import fs from 'fs';
import { app } from 'electron';
import { dataConfigFolderName, resolveInstanceTag } from '@/instance';

export const PRELOAD_FOLDER = path.join(__dirname, '..', 'preload');

export const TAB_PRELOAD = path.join(PRELOAD_FOLDER, 'tab.preload.js');
export const BROWSER_PRELOAD = path.join(PRELOAD_FOLDER, 'browser.preload.js');
export const EXTENSION_PRELOAD = path.join(PRELOAD_FOLDER, 'extension.preload.js');

export const RENDERER_FOLDER = path.join(__dirname, '..', 'renderer');

function appConfigFolder(): string {
  const tag = resolveInstanceTag(process.argv, process.env);
  const isDev = !!process.env.ELECTRON_RENDERER_URL;
  return dataConfigFolderName(tag, isDev);
}

export function userDataPath(): string {
  // Use process.pid to isolate test stores per Vitest worker/process
  // This prevents cross-test contamination in watch mode or parallel runs
  const folder = appConfigFolder();
  const userDataPath =
    process.env.TEST === 'true'
      ? path.join('/tmp', folder, String(process.pid))
      : path.join(os.homedir(), folder);

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  return userDataPath;
}

export function faviconsPath(): string {
  const extPath = path.join(userDataPath(), 'favicons');

  if (!fs.existsSync(extPath)) {
    fs.mkdirSync(extPath, { recursive: true });
  }

  return extPath;
}

export function extensionsPath(): string {
  const extPath = path.join(userDataPath(), 'extensions');

  if (!fs.existsSync(extPath)) {
    fs.mkdirSync(extPath, { recursive: true });
  }

  return extPath;
}

let _repoUrl: string | null = null;

export function getRepoUrl(): string {
  if (_repoUrl !== null) return _repoUrl;
  try {
    const pkgPath = path.join(app.getAppPath(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    _repoUrl = String(pkg.repository ?? '')
      .replace(/^git\+/, '')
      .replace(/\.git$/, '');
  } catch {
    _repoUrl = '';
  }
  return _repoUrl;
}
