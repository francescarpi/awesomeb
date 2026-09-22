import type { IExtension, IExtensionManifest, TExtensionId } from '~/types';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log';
import { Session } from 'electron';
import { lookup as lookupMimeType } from 'mime-types';
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
 * When `callerUrl` is provided (chrome-extension://EXT_ID/path/to/file.html),
 * relative icon paths are resolved against the caller's directory first,
 * matching Chrome's semantics where `action.setIcon` paths are relative to
 * the calling HTML file (popup, options page, etc.). Falls back to the
 * extension root if the caller-relative resolution doesn't find a file.
 *
 * @param manifestPath The path to the extension's manifest directory.
 * @param icon The icon path (relative, absolute, or chrome-extension URL) or
 *             a size->path dictionary.
 * @param callerUrl Optional chrome-extension URL identifying the calling
 *                  context (renderer window or service worker).
 * @returns A base64 data URL of the icon, or null if not found or on error.
 */
export function loadIcon(
  manifestPath: string,
  icon: string | { [index: number]: string } | undefined,
  callerUrl?: string,
): string | null {
  let iconPath: string | undefined;
  if (typeof icon === 'object') {
    iconPath = icon['48'] || icon['32'] || icon['16'];
    if (!iconPath) {
      return null;
    }
  } else {
    iconPath = icon;
  }

  if (!iconPath) {
    return null;
  }

  const extensionRoot = path.resolve(manifestPath);
  let iconRelativePath: string;

  if (/^[a-z][a-z\d+.-]*:/i.test(iconPath)) {
    let iconUrl: URL;
    try {
      iconUrl = new URL(iconPath);
    } catch {
      scopeLog.warn(`Invalid icon URL: ${iconPath}`);
      return null;
    }

    if (iconUrl.protocol !== 'chrome-extension:' || !iconUrl.hostname) {
      scopeLog.warn(`Unsupported icon URL scheme: ${iconPath}`);
      return null;
    }

    try {
      iconRelativePath = decodeURIComponent(iconUrl.pathname).replace(/^\/+/, '');
    } catch {
      scopeLog.warn(`Invalid encoded icon URL path: ${iconPath}`);
      return null;
    }
  } else {
    iconRelativePath = iconPath.replace(/^[/\\]+/, '');
  }

  let fullPath = path.resolve(extensionRoot, iconRelativePath);

  // Try resolving relative to the caller's directory first (Chrome's spec for
  // action.setIcon says relative paths are relative to the calling HTML file).
  // Only adopt the caller-relative candidate if it's inside extensionRoot AND
  // exists on disk; otherwise fall back to the root-relative path above.
  if (callerUrl) {
    const callerBase = resolveCallerBase(extensionRoot, callerUrl);
    if (callerBase) {
      const candidate = path.resolve(callerBase, iconRelativePath);
      if (
        candidate !== extensionRoot &&
        candidate.startsWith(`${extensionRoot}${path.sep}`) &&
        fs.existsSync(candidate)
      ) {
        fullPath = candidate;
      }
    }
  }

  if (fullPath !== extensionRoot && !fullPath.startsWith(`${extensionRoot}${path.sep}`)) {
    scopeLog.warn(`Icon path escapes extension directory: ${iconPath}`);
    return null;
  }

  scopeLog.debug(`Icon path: ${fullPath}`);
  if (!fs.existsSync(fullPath)) {
    scopeLog.warn(`Icon file not found at ${fullPath}`);
    return null;
  }
  try {
    const imageBuffer = fs.readFileSync(fullPath);
    const b64encoded = imageBuffer.toString('base64');
    const mimeType = lookupMimeType(fullPath) || 'image/png';
    return `data:${mimeType};base64,${b64encoded}`;
  } catch (err) {
    scopeLog.error(`Error reading icon file at ${fullPath}`, err);
    return null;
  }
}

/**
 * Resolves the filesystem base directory for the caller identified by
 * `callerUrl`. Returns `extensionRoot` unchanged when the caller lives at the
 * extension root (e.g. a service worker like `/service-worker.js`), or a
 * subdirectory under `extensionRoot` for callers in subfolders (e.g.
 * `chrome-extension://EXT_ID/popup/menu.html` → `extensionRoot/popup`).
 *
 * Returns `null` if the URL is malformed, not a chrome-extension URL, or
 * contains traversal segments that would escape extensionRoot.
 */
function resolveCallerBase(extensionRoot: string, callerUrl: string): string | null {
  try {
    const url = new URL(callerUrl);
    if (url.protocol !== 'chrome-extension:') return null;

    const pathname = decodeURIComponent(url.pathname); // e.g. "/popup/menu.html"
    const segments = pathname.split('/').filter(Boolean); // ["popup", "menu.html"]

    // Reject any traversal segments to prevent escaping extensionRoot via the caller URL.
    if (segments.some((s) => s === '..' || s === '.')) return null;

    if (segments.length <= 1) {
      // Caller is at the extension root (e.g. /service-worker.js or /manifest.json).
      return extensionRoot;
    }

    const callerDir = segments.slice(0, -1).join(path.sep); // "popup"
    const resolved = path.resolve(extensionRoot, callerDir);
    if (!resolved.startsWith(`${extensionRoot}${path.sep}`)) return null;
    return resolved;
  } catch {
    return null;
  }
}

/**
 * Validates a `callerUrl` reported by the renderer/service-worker IPC payload.
 * Returns the URL unchanged only if it's a well-formed `chrome-extension://` URL
 * whose hostname matches the given extension ID. Returns `undefined` otherwise
 * (missing, malformed, wrong scheme, or hostname mismatch). The result is safe
 * to forward to extension API handlers — callers can treat `undefined` as
 * "no caller context known" and fall back to extension-root-relative resolution.
 */
export function sanitizeCallerUrl(
  callerUrl: string | undefined,
  extensionId: TExtensionId,
): string | undefined {
  if (!callerUrl) return undefined;
  try {
    const url = new URL(callerUrl);
    if (url.protocol !== 'chrome-extension:' || url.hostname !== extensionId) {
      scopeLog.warn(`Rejecting callerUrl for ${extensionId}: ${callerUrl}`);
      return undefined;
    }
    return callerUrl;
  } catch {
    scopeLog.warn(`Invalid callerUrl for ${extensionId}: ${callerUrl}`);
    return undefined;
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

  // ses.serviceWorkers.on('console-message', (_event, details) => {
  //   scopeLog.debug('[SW console]', {
  //     message: details.message,
  //     sourceUrl: details.sourceUrl,
  //     line: details.lineNumber,
  //     level: details.level,
  //     versionId: details.versionId,
  //   });
  // });
}

export function unloadExtensionFromSession(ses: Session, extensionId: TExtensionId) {
  const sessionExtension = ses.extensions.getExtension(extensionId);
  if (sessionExtension) {
    ses.extensions.removeExtension(extensionId);
  }
}
