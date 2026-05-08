import { Browser, permissions, Window, FindInPage } from '@/core';
import {
  createHandler,
  windowChecker,
  viewChecker,
  findInPageChecker,
  tabChecker,
  certificateErrorChecker,
  modalChecker,
} from '@/utils';
import { FindInPageOptions, Certificate, type IpcMainInvokeEvent } from 'electron';
import type { IWinDesConTab, TFindInPageAction, TTabPreviewAction } from '~/types';
import log from 'electron-log';
import { URLInfoView } from './url-info';
import { Tab } from './tab';
import { TabPreview } from './tab-preview';
import { CertificateError } from '@/core/tab/certificate-error';

const scopeLog = log.scope('TabIPC');

export function setupTabIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window }>(
    'tabs:get-tab-containers',
    'handle',
    browser,
    [windowChecker, viewChecker.bind(null, ['sidebar'])],
    async ({ win }) => {
      return browser.renderer.tabContainers(win);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tab: IWinDesConTab }>(
    'tabs:close-find-in-tab',
    'on',
    browser,
    [tabChecker, findInPageChecker],
    async ({ tab }) => {
      tab.tab.webContents.stopFindInPage('clearSelection');
      tab.tab.stopFindInPage();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{
    tab: IWinDesConTab;
    query: string;
    action: TFindInPageAction;
    findInPage: FindInPage;
  }>(
    'tabs:find-in-page-action',
    'handle',
    browser,
    [tabChecker, findInPageChecker],
    async ({ tab, query, action, findInPage }) => {
      const wc = tab.tab.webContents;

      if (query.trim() === '') {
        wc.stopFindInPage('clearSelection');
        return null;
      }

      const options: FindInPageOptions = {};
      if (action === 'next') {
        options.findNext = true;
      } else if (action === 'previous') {
        options.forward = false;
      } else {
        options.forward = true;
      }

      const requestId = wc.findInPage(query, options);
      findInPage.addSearch(requestId, query, action);
      return requestId;
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tab: IWinDesConTab }>(
    'tabs:retry-failed',
    'on',
    browser,
    [tabChecker],
    async ({ tab }) => {
      tab.tab.clearFailLoad();
      tab.tab.webContents.reload();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{
    win: Window;
    tab: IWinDesConTab;
    data: { username: string; password: string } | null;
  }>('tabs:login', 'on', browser, [windowChecker, tabChecker], async ({ win, tab, data }) => {
    if (!tab.tab.basicAuthCallback) {
      scopeLog.warn(
        `Login IPC: Tab ${tab.tab.id} in window ${win.id} does not have a basicAuthCallback set`,
      );
      return;
    }

    win.modal.close();

    if (data) {
      tab.tab.basicAuthCallback(data.username, data.password);
    } else {
      tab.tab.basicAuthCallback();
    }

    tab.tab.setBasicAuthCallback(null);
  });

  //--------------------------------------------------------------------------------------
  createHandler<{ win: Window; tab: IWinDesConTab; fingerprint: string | null }>(
    'tabs:client-certificate',
    'on',
    browser,
    [windowChecker, tabChecker],
    async ({ tab, win, fingerprint }) => {
      if (!tab.tab.clientCertificates) {
        scopeLog.warn(
          `Client Certificate IPC: Tab ${tab.tab.id} in window ${win.id} does not have clientCertificates set`,
        );
        return;
      }

      const [certificates, callback] = tab.tab.clientCertificates;

      win.modal.close();

      if (fingerprint) {
        const certificate = certificates.find((cert) => cert.fingerprint === fingerprint);
        if (certificate) {
          callback(certificate);
        } else {
          scopeLog.warn(
            `Client Certificate IPC: Certificate with fingerprint ${fingerprint} not found for tab ${tab.tab.id} in window ${win.id}`,
          );
          callback(null as unknown as Certificate);
        }
      } else {
        callback(null as unknown as Certificate);
      }

      tab.tab.setClientCertificates(null);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tab: IWinDesConTab; url: string | null }>(
    'tab:show-url-info',
    'on',
    browser,
    [tabChecker],
    async ({ tab, url }) => {
      // Remove previous URL info view if exists
      for (const view of tab.window.views) {
        if (view.viewId.startsWith(`tab-${tab.tab.id}#url-info`)) {
          view.close();
          tab.window.removeView(view.viewId);
        }
      }

      if (url) {
        const view = new URLInfoView(tab.tab, url);
        tab.window.addView(view);
        tab.window.renderViews();
      } else {
        const viewId = `url-info-${tab.tab.id}`;
        const view = tab.window.getView<URLInfoView>(viewId);
        if (view) {
          view.close();
          tab.window.removeView(view.viewId);
        }
      }
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ certificateError: CertificateError; tab: IWinDesConTab }>(
    'tabs:trust-certificate-error',
    'on',
    browser,
    [tabChecker, certificateErrorChecker],
    async ({ certificateError, tab }) => {
      certificateError.callback(true);
      tab.tab.cleanCertificateError();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tab: IWinDesConTab; win: Window; value: boolean }>(
    'tabs:grant-permission',
    'on',
    browser,
    [windowChecker, tabChecker, modalChecker],
    async ({ tab, win, value }) => {
      if (!tab.tab.requestPermission) {
        scopeLog.warn(
          `Grant Permission IPC: Tab ${tab} in window ${win.id} does not have requestPermission set`,
        );
        return;
      }

      const [permission, host, callback] = tab.tab.requestPermission;

      callback(value);
      permissions.set(host, permission, value);
      tab.tab.setRequestPermission(null);
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ tab: IWinDesConTab; url: string }>(
    'tabs:open-tab-preview',
    'on',
    browser,
    [tabChecker],
    async ({ tab, url }) => {
      const previewTab = new Tab(browser, browser.idGenerator.nextTabId, {
        partition: tab.tab.partition,
        suspended: false,
        parent: tab.tab,
      });

      previewTab.setVisible(true);
      previewTab.loadURL(url);

      const tabPreview = new TabPreview(tab.tab, previewTab);
      tab.tab.setTabPreview(tabPreview);

      tab.window.addView(tabPreview);
      tab.window.addView(tabPreview.tab);

      tab.window.renderViews();

      browser.toRenderer.refreshTabContainers(tab.window);
      browser.refreshMainMenu();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{
    tab: IWinDesConTab;
    event: IpcMainInvokeEvent;
    action: TTabPreviewAction;
  }>('tabs:tab-preview-action', 'on', browser, [tabChecker], async ({ tab, event, action }) => {
    const tabPreview = tab.tab.tabPreview;
    if (!tabPreview) {
      scopeLog.warn(`No preview tab found for parent tab ID ${tab.tab.id}`);
      return;
    }

    if (tabPreview.webContentsId !== event.sender.id) {
      scopeLog.warn(
        `Sender webContents ID ${event.sender.id} does not match preview tab's webContentsId ${tabPreview.webContentsId}`,
      );
      return;
    }

    browser.performCommand(tab.window, `${action}-tab-preview`);
  });
}
