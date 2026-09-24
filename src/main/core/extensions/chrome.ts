import {
  ChromeTabs,
  ChromeAction,
  ChromeBookmarks,
  ChromePermissions,
  ChromeCookies,
} from './apis';
import { Browser, Window } from '@/core';
import { TExtensionId } from '~/types';
import { sanitizeCallerUrl } from './helpers';

import log from 'electron-log';
const scopeLog = log.scope('Chrome');

export class Chrome {
  private readonly _apis: {
    tabs: ChromeTabs;
    action: ChromeAction;
    bookmarks: ChromeBookmarks;
    permissions: ChromePermissions;
    cookies: ChromeCookies;
  };

  constructor(private readonly _browser: Browser) {
    this._apis = {
      tabs: new ChromeTabs(_browser),
      action: new ChromeAction(_browser),
      bookmarks: new ChromeBookmarks(_browser),
      permissions: new ChromePermissions(_browser),
      cookies: new ChromeCookies(_browser),
    };
  }

  async dispatch(
    window: Window,
    extensionId: TExtensionId,
    action: string,
    args: Record<string, unknown>,
    callerUrl?: string,
  ): Promise<unknown> {
    const extension = this._browser.extensions.getExtension(extensionId);
    if (!extension) {
      scopeLog.error(`Extension with id ${extensionId} does not exist`);
      return;
    }

    const actionParts = action.split('.');
    if (actionParts.length !== 2) {
      scopeLog.warn(`Invalid action format: ${action}`);
      return;
    }

    const [api, method] = actionParts;
    const instance = (this._apis as any)[api];
    if (!instance) {
      scopeLog.warn(`API not found: ${api}`);
      return;
    }

    if (typeof instance[method] !== 'function') {
      scopeLog.warn(`Method not found: ${method} in API ${api}`);
      return;
    }

    const safeCallerUrl = sanitizeCallerUrl(callerUrl, extensionId);

    scopeLog.info(`Dispatching ${api}.${method} with args:`, args);
    const response = await (instance[method] as CallableFunction)(
      window,
      extension,
      ...Object.values(args),
      safeCallerUrl,
    );

    return response;
  }

  get browser(): Browser {
    return this._browser;
  }

  get bookmarks(): ChromeBookmarks {
    return this._apis.bookmarks;
  }

  get tabs(): ChromeTabs {
    return this._apis.tabs;
  }

  get action(): ChromeAction {
    return this._apis.action;
  }

  get permissions(): ChromePermissions {
    return this._apis.permissions;
  }

  get cookies(): ChromeCookies {
    return this._apis.cookies;
  }
}
