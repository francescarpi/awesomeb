import type { IExtension, IExtensionManifest, TExtensionId } from '~/types';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log';
import { Session } from 'electron';
import { sessionName } from '@/core';

const scopeLog = log.scope('ExtensionsHelper');

/**
 * Loads the latest manifest for each extension found in the given root directory.
 * The directory structure is expected to be:
 * rootDir/
 *   extensionId1/
 *     version1/
 *       manifest.json
 *     version2/
 *       manifest.json
 *   extensionId2/
 *     version1/
 *       manifest.json
 *
 * @param rootDir The root directory where extensions are stored.
 * @returns An array of IExtension objects with the latest manifest data.
 */
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
          icon: loadIcon(manifestFullPath, manifest.action?.default_icon),
          enabled: false,
        });
      } catch (err) {
        scopeLog.error(`Error reading manifest for ${extId}@${latestVersion}`, err);
      }
    }
  }

  return manifests;
}

/**
 * Loads the extension icon as a base64 data URL.
 * It checks for the default_icon field in the manifest's action property.
 * If it's an object, it tries to find the best available size (48, 32, 16).
 *
 * @param manifestPath The path to the extension's manifest directory.
 * @param manifest The extension manifest object.
 * @returns A base64 data URL of the icon, or null if not found or on error.
 */
export function loadIcon(
  manifestPath: string,
  icon: string | { [index: number]: string } | undefined,
): string | null {
  let iconPath = icon;
  if (typeof iconPath === 'object') {
    iconPath = iconPath['48'] || iconPath['32'] || iconPath['16'];
    if (!iconPath) {
      return null;
    }
  }

  if (!iconPath) {
    return null;
  }

  const fullPath = path.join(manifestPath, iconPath as string);
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

/**
 * Loads an extension into the given Electron session.
 * It checks if the extension is already loaded in the session before attempting to load it.
 * It also sets up listeners for service worker events related to the extension.
 *
 * @param ses The Electron session to load the extension into.
 * @param extensionId The ID of the extension to load.
 * @param extensionPath The file system path to the extension's manifest directory.
 */
export async function loadExtensionToSession(ses: Session, extension: IExtension) {
  scopeLog.debug(
    `Attempting to load extension ${extension.id} (${extension.manifest.version}), path ${extension.manifestPath} to session ${sessionName(ses)}`,
  );
  const sessionExtension = ses.extensions.getExtension(extension.id);
  if (sessionExtension) {
    scopeLog.info(`Extension ${extension.id} already loaded in this session`);
    return;
  }

  const loadedExtension = await ses.extensions.loadExtension(extension.manifestPath);
  if (!loadedExtension) {
    scopeLog.error(`Failed to load extension ${extension.id} from path ${extension.manifestPath}`);
    return;
  }

  ses.extensions.on('extension-unloaded', (_event, unloadedExtension) => {
    if (unloadedExtension.id === extension.id) {
      scopeLog.debug(`Extension ${extension.id} was unloaded from session ${sessionName(ses)}`);
    }
  });

  ses.extensions.on('extension-ready', (_event, readyExtension) => {
    if (readyExtension.id === extension.id) {
      scopeLog.debug(`Extension ${extension.id} is ready in session ${sessionName(ses)}`);
    }
  });

  ses.extensions.on('extension-loaded', (_event, loadedExt) => {
    if (loadedExt.id === extension.id) {
      scopeLog.debug(`Extension ${extension.id} has been loaded in session ${sessionName(ses)}`);
    }
  });
}

export function unloadExtensionFromSession(ses: Session, extensionId: TExtensionId) {
  const sessionExtension = ses.extensions.getExtension(extensionId);
  if (sessionExtension) {
    ses.extensions.removeExtension(extensionId);
  }
}
