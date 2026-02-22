import path from 'path';
import os from 'os';
import fs from 'fs';

export const PRELOAD_FOLDER = path.join(__dirname, '..', 'preload');

export const RENDERER_FOLDER = path.join(__dirname, '..', 'renderer');

const APP_CONFIG_FOLDER = '.awesomeb';

export function userDataPath(): string {
  const userDataPath =
    process.env.TEST === 'true'
      ? path.join('/tmp', APP_CONFIG_FOLDER)
      : path.join(os.homedir(), APP_CONFIG_FOLDER);

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
