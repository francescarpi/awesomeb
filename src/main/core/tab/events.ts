import { tabWebContentsMenu } from '@/menu';
import { Tab } from './tab';
import contextMenu from 'electron-context-menu';
import log from 'electron-log';
import { HandlerDetails, WebContents, Certificate } from 'electron';
import { windowOpenHadler, Browser, parseFavicon } from '@/core';

const scopeLog = log.scope('TabEvents');

function checkIfRequireAttention(browser: Browser, tab: Tab) {
  const selectedDesktopResult = browser.selectedDesktop;
  const tabResult = browser.getTab(tab.id)!;
  tab.setRequireAttention(selectedDesktopResult?.desktop.id !== tabResult.desktop.id);
}

export function registerTabEvents(browser: Browser, tab: Tab) {
  //--------------------------------------------------------------------------------------
  tab.view.webContents.on('did-start-loading', () => {
    tab.setLoading(true);
  });

  //--------------------------------------------------------------------------------------
  tab.view.webContents.on('did-stop-loading', () => {
    tab.setLoading(false);
  });

  //--------------------------------------------------------------------------------------
  tab.view.webContents.on('did-navigate', (_event, url, _httpResponseCode, _httpStatusText) => {
    tab.setUrl(url);
  });

  //--------------------------------------------------------------------------------------
  tab.view.webContents.on(
    'did-navigate-in-page',
    (_event, url, isMainFrame, _frameProcessId, _frameRoutingId) => {
      if (isMainFrame) {
        tab.setUrl(url);
      }
    },
  );

  //--------------------------------------------------------------------------------------
  tab.view.webContents.on('page-title-updated', (_event, title, _explicitSet) => {
    const changed = tab.setTitle(title);
    if (changed) {
      checkIfRequireAttention(browser, tab);
    }
  });

  // ----------------------------------------------------------------------------------------------- //
  tab.view.webContents.on('found-in-page', async (_event, result) => {
    if (!tab.findInPage) {
      scopeLog.warn(`Received found-in-page event for Tab ${tab.id} but no search in progress.`);
      return;
    }

    const { requestId } = result;
    tab.findInPage.setResult(requestId, result);
  });

  // ----------------------------------------------------------------------------------------------- //
  tab.view.webContents.on('page-favicon-updated', async (_event, favicons) => {
    if (favicons && favicons.length > 0) {
      await parseFavicon(tab.view.webContents, favicons[0], (dataImage: string) => {
        const hasChanged = tab.setFavicon(dataImage);
        if (hasChanged) {
          checkIfRequireAttention(browser, tab);
        }
      });
    }
  });

  // ----------------------------------------------------------------------------------------------- //
  tab.view.webContents.on('media-started-playing', async () => {
    checkIfRequireAttention(browser, tab);
  });

  // ----------------------------------------------------------------------------------------------- //
  tab.view.webContents.on('focus', async () => {
    tab.setRequireAttention(false);
  });

  // ----------------------------------------------------------------------------------------------- //
  tab.view.webContents.on(
    'did-fail-load',
    async (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      event.preventDefault();
      if (!isMainFrame || errorCode === -3) {
        return;
      }

      if (errorCode === -310) {
        scopeLog.info('Ignoring ERR_TOO_MANY_REDIRECTS (-310) error');
        tab.view.webContents.reload();
        return;
      }

      tab.setUrl(validatedURL);
      tab.setFailLoad(errorCode, errorDescription, validatedURL);
    },
  );

  // ----------------------------------------------------------------------------------------------- //
  tab.view.webContents.on(
    'select-client-certificate',
    async (event, url, certificateList, callback) => {
      event.preventDefault();

      const tabInfo = browser.getTab(tab.id);
      if (!tabInfo) {
        scopeLog.error(
          `Failed to find Tab with ID ${tab.id} for client certificate selection. Aborting certificate selection.`,
        );
        callback(null as unknown as Certificate);
        return;
      }

      tab.setClientCertificates([certificateList, callback]);

      const certificates = certificateList
        .map((cert) => `${cert.fingerprint}|${cert.subjectName}`)
        .join(',');

      tabInfo.window.modal.open('client-certificate', {
        query: {
          winId: tabInfo.window.id.toString(),
          tabId: tab.id.toString(),
          url,
          certificates,
        },
      });
    },
  );

  // ----------------------------------------------------------------------------------------------- //
  tab.view.webContents.setWindowOpenHandler((details: HandlerDetails) =>
    windowOpenHadler(browser, details),
  );

  //--------------------------------------------------------------------------------------
  const window = tab.view.webContents;
  // This patch is needed because "electron-dl" accesses session via webContents
  // of the window => window_.webContents.session
  // @ts-expect-error As we are patching the window object, we can ignore the type error here
  window.webContents = tab.view.webContents;

  contextMenu({
    window,
    menu: (actions, params, browserWindow, dictionarySuggestions) => {
      const tabData = browser.getTab(tab.id)!;
      return tabWebContentsMenu(
        browser,
        tabData.window,
        tabData.tab.partition,
        actions,
        params,
        browserWindow as WebContents,
        dictionarySuggestions,
      );
    },
  });
}
