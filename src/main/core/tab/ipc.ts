import { Browser, permissions } from '@/core';
import {
  checkCertificateErrorSender,
  checkFailLoadSender,
  checkFindInPageSender,
  checkModalAndPagesSender,
} from '@/utils';
import { FindInPageOptions, ipcMain, Certificate } from 'electron';
import { TFindInPageAction, TTabId, TWindowId } from '~/types';
import log from 'electron-log';
import { URLInfoView } from './url-info';
import { Tab } from './tab';
import { TabPreview } from './tab-preview';

const scopeLog = log.scope('TabIPC');

export function setupTabIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  ipcMain.handle('tabs:get-tab-containers', async (event, winId: TWindowId) => {
    scopeLog.info(`IPC tabs:get-tab-containers received for window ${winId}`);
    return await checkModalAndPagesSender(event, browser, winId, ['sidebar'], async (window) => {
      return browser.renderer.tabContainers(window);
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('tabs:close-find-in-tab', async (event, tabId: TTabId) => {
    scopeLog.info(`IPC tabs:close-find-in-tab received for tab ${tabId}`);
    return await checkFindInPageSender(event, browser, tabId, async (tab, _findInPage) => {
      tab.view.webContents.stopFindInPage('clearSelection');
      tab.stopFindInPage();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.handle(
    'tabs:find-in-page-action',
    async (event, tabId: TTabId, action: TFindInPageAction, query: string) => {
      scopeLog.info(
        `IPC tabs:find-in-page-action received for tab ${tabId} with action ${action} and query "${query}"`,
      );
      return await checkFindInPageSender(event, browser, tabId, async (tab, findInPage) => {
        const wc = tab.view.webContents;

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
      });
    },
  );

  //--------------------------------------------------------------------------------------
  ipcMain.on('tabs:retry-failed', async (event, tabId: TTabId) => {
    scopeLog.info(`IPC tabs:retry-failed received for tab ${tabId}`);
    return await checkFailLoadSender(event, browser, tabId, async (tab, _failLoad) => {
      tab.clearFailLoad();
      tab.view.webContents.reload();
    });
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'tabs:login',
    async (
      event,
      winId: TWindowId,
      tabId: TTabId,
      data: { username: string; password: string } | null,
    ) => {
      scopeLog.info(`IPC tabs:login received for window ${winId} and tab ${tabId}`);
      return await checkModalAndPagesSender(event, browser, winId, [], async (window) => {
        const tabData = window.getTab(tabId);
        if (!tabData) {
          scopeLog.warn(`Login IPC: Tab ${tabId} not found in window ${winId}`);
          return;
        }

        const tab = tabData.tab;
        if (!tab.basicAuthCallback) {
          scopeLog.warn(
            `Login IPC: Tab ${tabId} in window ${winId} does not have a basicAuthCallback set`,
          );
          return;
        }

        window.modal.close();

        if (data) {
          tab.basicAuthCallback(data.username, data.password);
        } else {
          tab.basicAuthCallback();
        }

        tab.setBasicAuthCallback(null);
      });
    },
  );

  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'tabs:client-certificate',
    async (event, winId: TWindowId, tabId: TTabId, fingerprint: string | null) => {
      scopeLog.info(
        `IPC tabs:client-certificate received for window ${winId} and tab ${tabId} with fingerprint ${fingerprint}`,
      );
      return await checkModalAndPagesSender(event, browser, winId, [], async (window) => {
        const tabData = window.getTab(tabId);
        if (!tabData) {
          scopeLog.warn(`Login IPC: Tab ${tabId} not found in window ${winId}`);
          return;
        }

        const tab = tabData.tab;
        if (!tab.clientCertificates) {
          scopeLog.warn(
            `Client Certificate IPC: Tab ${tabId} in window ${winId} does not have clientCertificates set`,
          );
          return;
        }

        const [certificates, callback] = tab.clientCertificates;

        window.modal.close();

        if (fingerprint) {
          const certificate = certificates.find((cert) => cert.fingerprint === fingerprint);
          if (certificate) {
            callback(certificate);
          } else {
            scopeLog.warn(
              `Client Certificate IPC: Certificate with fingerprint ${fingerprint} not found for tab ${tabId} in window ${winId}`,
            );
            callback(null as unknown as Certificate);
          }
        } else {
          callback(null as unknown as Certificate);
        }

        tab.setClientCertificates(null);
      });
    },
  );

  //--------------------------------------------------------------------------------------
  ipcMain.on('tab:show-url-info', async (event, url: string | null) => {
    scopeLog.info(`IPC tabs:show-url-info received with url ${url}`);
    const selectedTab = browser.selectedTab;
    if (!selectedTab || selectedTab.tab.view.webContentsId !== event.sender.id) {
      scopeLog.warn(
        `URL Info IPC: No selected tab or sender does not match selected tab's webContentsId`,
      );
      return;
    }

    // Remove previous URL info view if exists
    for (const view of selectedTab.window.views) {
      if (view.id.startsWith(`tab-${selectedTab.tab.id}#url-info`)) {
        view.close();
        selectedTab.window.removeView(view.id);
      }
    }

    if (url) {
      const view = new URLInfoView(selectedTab.tab, url);
      selectedTab.window.addView(view);
      selectedTab.window.renderViews();
    } else {
      const viewId = `url-info-${selectedTab.tab.id}`;
      const view = selectedTab.window.getView<URLInfoView>(viewId);
      if (view) {
        view.close();
        selectedTab.window.removeView(view.id);
      }
    }
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on('tabs:trust-certificate-error', async (event, tabId: TTabId) => {
    scopeLog.info(`IPC tabs:trust-certificate-error received for tab ${tabId}`);
    return await checkCertificateErrorSender(
      event,
      browser,
      tabId,
      async (tab, certificateError) => {
        certificateError.callback(true);
        tab.cleanCertificateError();
      },
    );
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'tabs:grant-permission',
    async (event, winId: TWindowId, tabId: TTabId, value: boolean) => {
      scopeLog.info(
        `IPC tabs:grant-permission received for window ${winId}, tab ${tabId} with value ${value}`,
      );
      return await checkModalAndPagesSender(event, browser, winId, [], async (window) => {
        const tabData = window.getTab(tabId);
        if (!tabData) {
          scopeLog.warn(`Grant Permission IPC: Tab ${tabId} not found in window ${winId}`);
          return;
        }

        if (!tabData.tab.requestPermission) {
          scopeLog.warn(
            `Grant Permission IPC: Tab ${tabId} in window ${winId} does not have requestPermission set`,
          );
          return;
        }

        const [permission, host, callback] = tabData.tab.requestPermission;

        callback(value);
        permissions.set(host, permission, value);
        tabData.tab.setRequestPermission(null);
      });
    },
  );

  //--------------------------------------------------------------------------------------
  ipcMain.on('tabs:open-tab-preview', async (event, url: string) => {
    const parentTabData = browser.getTabByWebContentsId(event.sender.id);
    if (!parentTabData) {
      scopeLog.warn(`No tab found for webContents ID ${event.sender.id}`);
      return;
    }

    const tab = new Tab(browser, browser.idGenerator.nextTabId, {
      partition: parentTabData.tab.partition,
      suspended: false,
      parent: parentTabData.tab,
    });

    tab.view.setVisible(true);
    tab.loadURL(url);

    const tabPreview = new TabPreview(parentTabData.tab, tab);
    parentTabData.tab.setTabPreview(tabPreview);

    parentTabData.window.addView(tabPreview);
    parentTabData.window.addView(tabPreview.tab.view);

    parentTabData.window.renderViews();

    browser.rendererEmmiter.refreshTabContainers(parentTabData.window);
    browser.refreshMainMenu();
  });

  //--------------------------------------------------------------------------------------
  ipcMain.on(
    'tabs:tab-preview-action',
    async (event, parentTabId: TTabId, action: 'close' | 'accept') => {
      scopeLog.info(`tab previoew action received for parent tab ${parentTabId}`);
      const parentTabData = browser.getTab(parentTabId);
      if (!parentTabData) {
        scopeLog.warn(`No tab found for parent tab ID ${parentTabId}`);
        return;
      }

      const tabPreview = parentTabData.tab.tabPreview;
      if (!tabPreview) {
        scopeLog.warn(`No preview tab found for parent tab ID ${parentTabId}`);
        return;
      }

      if (tabPreview.webContentsId !== event.sender.id) {
        scopeLog.warn(
          `Sender webContents ID ${event.sender.id} does not match preview tab's webContentsId ${tabPreview.webContentsId}`,
        );
        return;
      }

      browser.performCommand(parentTabData.window, `${action}-tab-preview`);
    },
  );
}
