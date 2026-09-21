import { Browser, Window } from '@/core';
import { TPartitionId, TExtensionId } from '~/types';

export class ChromePermissions {
  private readonly SUPPORTED_PERMISSIONS = new Set(['bookmarks', 'tabs']);

  constructor(_browser: Browser) {}

  async contains(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    args: chrome.permissions.Permissions,
  ): Promise<boolean> {
    if (args.origins) {
      // TODO Pending to know how to evaluate the origins...
      return true;
    }

    const requested = new Set(args.permissions || []);
    for (const perm of requested) {
      if (!this.SUPPORTED_PERMISSIONS.has(perm)) {
        return false;
      }
    }
    return requested.size > 0;
  }

  async request(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    args: chrome.permissions.Permissions,
  ): Promise<boolean> {
    return this.contains(_window, _partitionId, _extensionId, args);
  }

  async remove(
    _window: Window,
    _partitionId: TPartitionId,
    _extensionId: TExtensionId,
    _args: chrome.permissions.Permissions,
  ): Promise<boolean> {
    return true;
  }
}
