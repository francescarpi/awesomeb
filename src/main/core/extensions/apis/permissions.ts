import { Browser, Window } from '@/core';
import type { IExtension } from '~/types';

export class ChromePermissions {
  constructor(_browser: Browser) {}

  async contains(
    _window: Window,
    extension: IExtension,
    args: chrome.permissions.Permissions,
  ): Promise<boolean> {
    const hasPermissions =
      args.permissions && extension.manifest.permissions
        ? args.permissions.every((p) => extension.manifest.permissions!.includes(p))
        : true;

    const hasOrigins =
      args.origins && extension.manifest.origins
        ? args.origins.every((p) => extension.manifest.origins!.includes(p))
        : true;

    return hasPermissions && hasOrigins;
  }

  async request(
    _window: Window,
    _extension: IExtension,
    _args: chrome.permissions.Permissions,
  ): Promise<boolean> {
    // TODO: Pendint to implement
    return true;
  }

  async remove(
    _window: Window,
    _extension: IExtension,
    _args: chrome.permissions.Permissions,
  ): Promise<boolean> {
    return true;
  }
}
