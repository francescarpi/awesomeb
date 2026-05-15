import Store from 'electron-store';
import { IExtensionsStore } from './types';
import { userDataPath, extensionsPath } from '@/paths';
import { IExtension, TExtensionId } from '~/types';
import {
  loadLatestExtensionManifests,
  loadIcon,
  loadExtensionToSession,
  unloadExtensionFromSession,
} from './helpers';
import log from 'electron-log';
import { Browser, partitions, Partition, Window } from '@/core';
import { ExtensionPopupOverlay, ExtensionPopup } from './popup';
import { Chrome } from './chrome';
import path from 'path';

const scopeLog = log.scope('Extensions');

export class Extensions {
  private readonly _store: Store<IExtensionsStore>;
  public readonly chrome: Chrome;

  constructor(private readonly _browser: Browser) {
    this.chrome = new Chrome(_browser);
    this._store = new Store<IExtensionsStore>({
      name: 'extensions',
      cwd: userDataPath(),
      defaults: {
        extensions: {},
      },
    });
  }

  refresh() {
    const path = extensionsPath();
    const data = loadLatestExtensionManifests(path);
    const existing = this._store.get('extensions');

    for (const extension of data) {
      existing[extension.id] = {
        ...extension,
        enabled: existing[extension.id]?.enabled ?? false,
      };
    }

    // Cleanup removed extensions
    for (const extId of Object.keys(existing)) {
      if (!data.find((ext) => ext.id === extId)) {
        delete existing[extId];
      }
    }

    this._store.set('extensions', existing);
  }

  get all(): IExtension[] {
    const extensions = this._store.get('extensions');
    return Object.values(extensions);
  }

  get active(): IExtension[] {
    return this.all.filter((ext) => ext.enabled);
  }

  toggle(id: TExtensionId): IExtension | null {
    const extension = this.getExtension(id);
    if (!extension) {
      scopeLog.warn(`Extension with id ${id} not found`);
      return null;
    }

    const enabled = !extension.enabled;
    this._store.set(`extensions.${id}.enabled`, enabled);
    this._browser.eventsChannel.emit('extensions:enabled-changed');

    this.loadUnloadExtensionToAllSessions(id, enabled ? 'load' : 'unload');

    return this.getExtension(id);
  }

  getExtension(id: TExtensionId): IExtension | null {
    return this._store.get(`extensions.${id}`) || null;
  }

  openPopup(extensionId: TExtensionId, window: Window, partition: Partition, x: number, y: number) {
    const extension = this.getExtension(extensionId);
    if (!extension) {
      scopeLog.warn(`Extension with id ${extensionId} not found`);
      return;
    }

    const overlay = new ExtensionPopupOverlay(window.id);
    window.addView(overlay);

    const popup = new ExtensionPopup(partition, x, y);
    const popupUrl = `chrome-extension://${extensionId}/${extension.manifest.action.default_popup}?partitionId=${partition.id}&winId=${window.id}`;
    popup.webContents.loadURL(popupUrl);
    window.addView(popup);

    // popup.webContents.openDevTools({ mode: 'detach' });

    window.renderViews();
  }

  closePopup(window: Window) {
    window.removeView('extension-popup-overlay');
    window.removeView('extension-popup');
  }

  iniPopup(window: Window, width: number, height: number) {
    const popup = window.getView<ExtensionPopup>('extension-popup');
    if (popup) {
      popup.setSize(width || 225, height || 100);
      popup.refreshBounds(window);
      popup.setVisible(true);
      // popup.webContents.openDevTools({ mode: 'detach' });
    }
  }

  updateIcon(extensionId: TExtensionId, details: chrome.action.TabIconDetails) {
    const extension = this.getExtension(extensionId);
    if (!extension) {
      scopeLog.warn(`Extension with id ${extensionId} not found for updating icon`);
      return;
    }

    const icon = loadIcon(
      extension.manifestPath,
      details.path ? path.join('popup', details.path as string) : undefined,
    );

    if (icon) {
      const newExtension = {
        ...extension,
        icon,
      };
      this._store.set(`extensions.${extensionId}`, newExtension);
      this._browser.eventsChannel.emit('extensions:icon-updated', extensionId);
    }
  }

  async loadUnloadExtensionToAllSessions(extensionId: TExtensionId, action: 'load' | 'unload') {
    const extension = this.getExtension(extensionId);
    if (!extension) {
      scopeLog.warn(`Extension with id ${extensionId} not found for ${action}`);
      return;
    }

    for (const partition of partitions.allForExtensions) {
      if (action === 'load') {
        await loadExtensionToSession(partition.ses, extension);
      } else {
        unloadExtensionFromSession(partition.ses, extension.id);
      }
    }
  }
}
