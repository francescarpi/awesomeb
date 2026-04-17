import type { IExtension, IExtensionManifest } from '~/types';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log';

const scopeLog = log.scope('ExtensionsHelper');

export function loadLatestExtensionManifests(rootDir: string): IExtension[] {
  const manifests: IExtension[] = [];

  // Each subfolder inside rootDir is an extension ID
  const extensionIds = fs.readdirSync(rootDir).filter((f) => {
    const fullPath = path.join(rootDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const extId of extensionIds) {
    const extPath = path.join(rootDir, extId);

    // Inside each extension folder, there are subfolders for versions
    const versions = fs.readdirSync(extPath).filter((f) => {
      const fullPath = path.join(extPath, f);
      return fs.statSync(fullPath).isDirectory();
    });

    if (versions.length === 0) continue;

    // Sort versions in descending order (Chrome uses version strings like "1.0.2")
    const sorted = versions.sort((a, b) => {
      const pa = a.split('.').map((n) => parseInt(n, 10));
      const pb = b.split('.').map((n) => parseInt(n, 10));
      const len = Math.max(pa.length, pb.length);
      for (let i = 0; i < len; i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na !== nb) return nb - na; // larger number = newer version
      }
      return 0;
    });

    const latestVersion = sorted[0];
    const manifestPath = path.join(extPath, latestVersion, 'manifest.json');

    if (fs.existsSync(manifestPath)) {
      try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(raw) as IExtensionManifest;
        const manifestFullPath = path.join(extPath, latestVersion);

        manifests.push({
          id: extId,
          manifest,
          manifestPath: manifestFullPath,
          icon: loadIcon(manifestFullPath, manifest),
          enabled: false,
        });
      } catch (err) {
        scopeLog.error(`Error reading manifest for ${extId}@${latestVersion}`, err);
      }
    }
  }

  return manifests;
}

function loadIcon(manifestPath: string, manifest: IExtensionManifest): string | null {
  let iconPath = manifest.action.default_icon;
  if (typeof iconPath === 'object') {
    iconPath = iconPath['48'] || iconPath['32'] || iconPath['16'];
    if (!iconPath) {
      return null;
    }
  }

  if (!iconPath) {
    return null;
  }

  const fullPath = path.join(manifestPath, iconPath);
  if (!fs.existsSync(fullPath)) {
    scopeLog.warn(`Icon file not found at ${fullPath}`);
    return null;
  }
  try {
    const imageBuffer = fs.readFileSync(fullPath);
    const b64encoded = imageBuffer.toString('base64');
    return `data:image/png;base64,${b64encoded}`;
  } catch (err) {
    scopeLog.error(`Error reading icon file at ${fullPath}`, err);
    return null;
  }
}
