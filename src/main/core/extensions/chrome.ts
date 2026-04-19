import { ChromeTabs, ChromeAction } from './apis';
import { Browser, Window } from '@/core';
import { TExtensionId, TPartitionId } from '~/types';

import log from 'electron-log';
const scopeLog = log.scope('Chrome');

export class Chrome {
  private readonly _apis: { tabs: ChromeTabs; action: ChromeAction };

  constructor(private readonly _browser: Browser) {
    this._apis = {
      tabs: new ChromeTabs(_browser),
      action: new ChromeAction(_browser),
    };
  }

  async dispatch(
    window: Window,
    partitionId: TPartitionId,
    extensionId: TExtensionId,
    action: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
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

    scopeLog.info(`Dispatching ${api}.${method} with args:`, args);
    const response = await (instance[method] as Function)(
      window,
      partitionId,
      extensionId,
      ...Object.values(args),
    );

    return response;
  }

  get browser(): Browser {
    return this._browser;
  }
}
