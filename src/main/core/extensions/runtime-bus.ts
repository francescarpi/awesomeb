import type { WebContents, ServiceWorkerMain } from 'electron';
import type { TExtensionId } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('RuntimeBus');

export type RuntimeContext = 'popup' | 'background' | 'content-script';

export type RuntimeMessageEnvelope = {
  message: unknown;
  sender: { id: TExtensionId; context: RuntimeContext };
};

interface ExtensionEntry {
  popups: Set<WebContents>;
  sw: ServiceWorkerMain | null;
}

const RUNTIME_EVENT_CHANNEL = 'extensions:crx-event:runtime.onMessage';

export class RuntimeBus {
  private readonly _entries = new Map<TExtensionId, ExtensionEntry>();

  private _entry(extensionId: TExtensionId): ExtensionEntry {
    let entry = this._entries.get(extensionId);
    if (!entry) {
      entry = { popups: new Set(), sw: null };
      this._entries.set(extensionId, entry);
    }
    return entry;
  }

  registerPopup(extensionId: TExtensionId, webContents: WebContents): void {
    const entry = this._entry(extensionId);
    entry.popups.add(webContents);
    webContents.once('destroyed', () => {
      entry.popups.delete(webContents);
      if (entry.popups.size === 0 && !entry.sw) {
        this._entries.delete(extensionId);
      }
    });
  }

  unregisterPopup(extensionId: TExtensionId, webContents: WebContents): void {
    const entry = this._entries.get(extensionId);
    if (!entry) return;
    entry.popups.delete(webContents);
    if (entry.popups.size === 0 && !entry.sw) {
      this._entries.delete(extensionId);
    }
  }

  setServiceWorker(extensionId: TExtensionId, worker: ServiceWorkerMain): void {
    this._entry(extensionId).sw = worker;
  }

  clearServiceWorker(extensionId: TExtensionId): void {
    const entry = this._entries.get(extensionId);
    if (!entry) return;
    entry.sw = null;
    if (entry.popups.size === 0) {
      this._entries.delete(extensionId);
    }
  }

  removeExtension(extensionId: TExtensionId): void {
    this._entries.delete(extensionId);
  }

  send(
    extensionId: TExtensionId,
    envelope: RuntimeMessageEnvelope,
    senderIdentifier: string,
  ): void {
    const entry = this._entries.get(extensionId);
    if (!entry) {
      scopeLog.warn(`No bus entry for extension ${extensionId} — message dropped`);
      return;
    }

    const sentCount = { popups: 0, sw: 0 };

    for (const wc of entry.popups) {
      if (wc.isDestroyed()) {
        entry.popups.delete(wc);
        continue;
      }
      if (senderIdentifier === `wc:${wc.id}`) continue;
      try {
        wc.send(RUNTIME_EVENT_CHANNEL, envelope);
        sentCount.popups++;
      } catch (err) {
        scopeLog.warn(`Failed to send to popup ${wc.id} for ${extensionId}:`, err);
      }
    }

    if (entry.sw && senderIdentifier !== `sw:${entry.sw.scriptURL}`) {
      try {
        entry.sw.send(RUNTIME_EVENT_CHANNEL, envelope);
        sentCount.sw++;
      } catch (err) {
        scopeLog.warn(`Failed to send to SW for ${extensionId}:`, err);
      }
    }

    scopeLog.debug(
      `Fanned out runtime.onMessage for ${extensionId} from ${senderIdentifier}: ${sentCount.popups} popups, ${sentCount.sw} sw`,
    );
  }

  hasRecipients(extensionId: TExtensionId): boolean {
    const entry = this._entries.get(extensionId);
    if (!entry) return false;
    if (entry.sw) return true;
    for (const wc of entry.popups) {
      if (!wc.isDestroyed()) return true;
    }
    return false;
  }
}

export const RUNTIME_SEND_MESSAGE_CHANNEL = 'extensions:runtime-send-message';
export const RUNTIME_SEND_RESPONSE_CHANNEL = 'extensions:runtime-send-response';
export const RUNTIME_RESPONSE_PREFIX = 'extensions:crx-runtime-response:';
