import { beforeAll, describe, expect, test, vi, beforeEach } from 'vitest';
import { clipboard, Notification } from 'electron';
import { Browser, partitions } from '@/core';
import { initI18n } from '~/i18n';

beforeAll(async () => {
  await initI18n();
});
import * as windowMinimize from './window-minimize';
import * as windowMaximize from './window-maximize';
import * as windowClose from './window-close';
import * as windowToggleSidebar from './window-toggle-sidebar';
import * as windowToggleMaximizeArea from './window-toggle-maximize-area';
import * as desktopNext from './desktop-next';
import * as desktopPrev from './desktop-prev';
import * as desktopSelect from './desktop-select';
import * as desktopRename from './desktop-rename';
import * as desktopTheme from './desktop-theme';
import * as tabNew from './tab-new';
import * as tabNext from './tab-next';
import * as tabPrev from './tab-prev';
import * as tabSuspend from './tab-suspend';
import * as tabContainerSelectByIndex from './tabcontainer-select-by-index';
import * as tabSelect from './tab-select';
import * as tabClose from './tab-close';
import * as tabDuplicate from './tab-duplicate';
import * as tabReload from './tab-reload';
import * as tabHistoryBack from './tab-history-back';
import * as tabHistoryForward from './tab-history-forward';
import * as urlEdit from './url-edit';
import * as urlCopy from './url-copy';
import * as tabcontainerMoveUp from './tabcontainer-move-up';
import * as tabcontainerMoveDown from './tabcontainer-move-down';

describe('Commands', () => {
  let browser: Browser;

  beforeEach(() => {
    browser = new Browser();
    partitions.init();
    const window = browser.createWindow(1);
    window.createDefaultDesktops();
  });

  describe('Window Commands', () => {
    test('window-minimize: should minimize the window', async () => {
      const window = browser.activeWindow!;
      // Add missing methods to the mock
      window.bw.minimize = vi.fn();
      const minimizeSpy = vi.spyOn(window.bw, 'minimize');

      await browser.performCommand(window, windowMinimize.TRIGGER);

      expect(minimizeSpy).toHaveBeenCalled();
    });

    test('window-maximize: should maximize the window when not maximized', async () => {
      const window = browser.activeWindow!;
      // Add missing methods to the mock
      window.bw.maximize = vi.fn();
      window.bw.unmaximize = vi.fn();
      window.bw.isMaximized = vi.fn().mockReturnValue(false);
      const maximizeSpy = vi.spyOn(window.bw, 'maximize');

      await browser.performCommand(window, windowMaximize.TRIGGER);

      expect(maximizeSpy).toHaveBeenCalled();
    });

    test('window-maximize: should unmaximize the window when already maximized', async () => {
      const window = browser.activeWindow!;
      // Add missing methods to the mock
      window.bw.maximize = vi.fn();
      window.bw.unmaximize = vi.fn();
      window.bw.isMaximized = vi.fn().mockReturnValue(true);
      const unmaximizeSpy = vi.spyOn(window.bw, 'unmaximize');

      await browser.performCommand(window, windowMaximize.TRIGGER);

      expect(unmaximizeSpy).toHaveBeenCalled();
    });

    test('window-close: should close the window', async () => {
      const window = browser.activeWindow!;
      const closeSpy = vi.spyOn(window.bw, 'close');

      await browser.performCommand(window, windowClose.TRIGGER);

      expect(closeSpy).toHaveBeenCalled();
    });

    test('window-toggle-sidebar: should toggle the sidebar visibility', async () => {
      const window = browser.activeWindow!;
      const toggleSpy = vi.spyOn(window, 'toggleSidebar');

      await browser.performCommand(window, windowToggleSidebar.TRIGGER);

      expect(toggleSpy).toHaveBeenCalled();
    });

    test('window-toggle-maximize-area: should toggle maximize area', async () => {
      const window = browser.activeWindow!;
      const toggleSpy = vi.spyOn(window, 'toggleMaximizeArea');

      await browser.performCommand(window, windowToggleMaximizeArea.TRIGGER);

      expect(toggleSpy).toHaveBeenCalled();
    });
  });

  describe('Desktop Commands', () => {
    test('desktop-next: should switch to next desktop', async () => {
      const window = browser.activeWindow!;
      const selectSpy = vi.spyOn(window, 'selectDesktop');

      await browser.performCommand(window, desktopNext.TRIGGER);

      expect(selectSpy).toHaveBeenCalledWith('next');
    });

    test('desktop-prev: should switch to previous desktop', async () => {
      const window = browser.activeWindow!;
      const selectSpy = vi.spyOn(window, 'selectDesktop');

      await browser.performCommand(window, desktopPrev.TRIGGER);

      expect(selectSpy).toHaveBeenCalledWith('prev');
    });

    test('desktop-select: should switch to a specific desktop', async () => {
      const window = browser.activeWindow!;
      const desktop = window.desktops[0];
      const selectSpy = vi.spyOn(window, 'selectDesktop');

      await browser.performCommand(window, desktopSelect.TRIGGER, {
        desktopId: desktop.id,
      });

      expect(selectSpy).toHaveBeenCalledWith(desktop.id);
    });

    test('desktop-rename: should rename a desktop', async () => {
      const window = browser.activeWindow!;
      const desktop = window.desktops[0];
      const setNameSpy = vi.spyOn(desktop, 'setName');
      const shortName = 'Work';
      const longName = 'Work Space';

      await browser.performCommand(window, desktopRename.TRIGGER, {
        desktopId: desktop.id,
        shortName,
        longName,
      });

      expect(setNameSpy).toHaveBeenCalledWith(shortName, longName);
    });

    test('desktop-rename: should handle non-existent desktop gracefully', async () => {
      const window = browser.activeWindow!;

      await browser.performCommand(window, desktopRename.TRIGGER, {
        desktopId: 999,
        name: 'Test',
      });

      // Should not throw an error
      expect(true).toBe(true);
    });

    test('desktop-theme: should change desktop theme', async () => {
      const window = browser.activeWindow!;
      const desktop = window.desktops[0];
      const setThemeSpy = vi.spyOn(desktop, 'setTheme');

      await browser.performCommand(window, desktopTheme.TRIGGER, {
        desktopId: desktop.id,
        themeName: 'dark',
      });

      expect(setThemeSpy).toHaveBeenCalled();
    });

    test('desktop-theme: should handle non-existent desktop gracefully', async () => {
      const window = browser.activeWindow!;

      await browser.performCommand(window, desktopTheme.TRIGGER, {
        desktopId: 999,
        themeName: 'dark',
      });

      // Should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('Tab Commands', () => {
    test('tab-new: should open a new tab', async () => {
      const window = browser.activeWindow!;
      const openURLSpy = vi.spyOn(browser, 'openURL');
      const closeModalSpy = vi.spyOn(window.modal, 'close');

      await browser.performCommand(window, tabNew.TRIGGER, {
        query: 'https://example.com',
        partitionId: 'default',
        searchEngineCode: 'google',
        targetId: 'active-desktop',
      });

      expect(closeModalSpy).toHaveBeenCalled();
      expect(openURLSpy).toHaveBeenCalledWith('https://example.com', {
        partitionId: 'default',
        searchEngineCode: 'google',
        targetId: 'active-desktop',
        selectTab: true,
      });
    });

    test('tab-next: should switch to next tab', async () => {
      const window = browser.activeWindow!;
      const selectSpy = vi.spyOn(window, 'selectTab');

      await browser.performCommand(window, tabNext.TRIGGER);

      expect(selectSpy).toHaveBeenCalledWith('next', { sameDesktop: true });
    });

    test('tab-prev: should switch to previous tab', async () => {
      const window = browser.activeWindow!;
      const selectSpy = vi.spyOn(window, 'selectTab');

      await browser.performCommand(window, tabPrev.TRIGGER);

      expect(selectSpy).toHaveBeenCalledWith('prev', { sameDesktop: true });
    });

    test('tab-next: navigates into child tab containers in DFS pre-order', async () => {
      const window = browser.activeWindow!;
      const p1 = await browser.openURL('http://p1.com', { selectTab: true });
      const p2 = await browser.openURL('http://p2.com', { selectTab: true });
      const c1 = await browser.openURL('http://c1.com', {
        parentTabContainer: p2!.tabContainer,
        selectTab: true,
      });

      // Currently c1 is selected. Reset selection to p1 to start the navigation
      // from the first parent, then go next twice and verify we reach p2 and c1.
      window.selectedDesktop!.selectTabContainer(p1!.tabContainer.id);
      p1!.tabContainer.selectTab(p1!.tab.id);

      await browser.performCommand(window, tabNext.TRIGGER);
      expect(window.selectedDesktop!.selectedTabContainer?.selectedTab?.id).toBe(p2!.tab.id);

      await browser.performCommand(window, tabNext.TRIGGER);
      expect(window.selectedDesktop!.selectedTabContainer?.selectedTab?.id).toBe(c1!.tab.id);
    });

    test('tab-prev: navigates from child back to parent', async () => {
      const window = browser.activeWindow!;
      const p2 = await browser.openURL('http://p2.com', { selectTab: true });
      await browser.openURL('http://c1.com', {
        parentTabContainer: p2!.tabContainer,
        selectTab: true,
      });

      // Currently c1 (child) is selected. Go prev once and verify we land on p2.
      await browser.performCommand(window, tabPrev.TRIGGER);
      expect(window.selectedDesktop!.selectedTabContainer?.selectedTab?.id).toBe(p2!.tab.id);
    });

    test('tab-select: should select a specific tab', async () => {
      const window = browser.activeWindow!;
      browser.openURL('https://example.com');
      const desktop = window.selectedDesktop!;
      const tab = desktop.tabContainers[0].tabs[0];
      const selectSpy = vi.spyOn(window, 'selectTab');

      await browser.performCommand(window, tabSelect.TRIGGER, {
        tabId: tab.id,
      });

      expect(selectSpy).toHaveBeenCalledWith(tab.id);
    });

    test('tab-select: should handle non-existent tab gracefully', async () => {
      const window = browser.activeWindow!;

      await browser.performCommand(window, tabSelect.TRIGGER, {
        tabId: 999,
      });

      // Should not throw an error
      expect(true).toBe(true);
    });

    test('tab-close: should close the active tab', async () => {
      const window = browser.activeWindow!;
      const result = browser.openURL('https://example.com');

      // Get the created tab directly
      expect(result).not.toBeNull();
      const desktop = window.selectedDesktop!;
      const tabContainer = desktop.tabContainers[0];
      const tab = tabContainer.tabs[0];

      // Select the tab to make it active
      await window.selectTab(tab.id);

      const closeTabSpy = vi.spyOn(browser, 'closeTab');

      // Pass empty object as params since command expects it
      await browser.performCommand(window, tabClose.TRIGGER, {});

      expect(closeTabSpy).toHaveBeenCalledWith(tab.id);
    });

    test('tab-close: should close a specific tab by ID', async () => {
      const window = browser.activeWindow!;
      browser.openURL('https://example.com');
      browser.openURL('https://example2.com');
      const desktop = window.selectedDesktop!;
      const tab = desktop.tabContainers[0].tabs[0];
      const closeTabSpy = vi.spyOn(browser, 'closeTab');

      await browser.performCommand(window, tabClose.TRIGGER, {
        tabId: tab.id,
      });

      expect(closeTabSpy).toHaveBeenCalledWith(tab.id);
    });

    test('tab-close: should handle non-existent tab gracefully', async () => {
      const window = browser.activeWindow!;
      browser.openURL('https://example.com');

      await browser.performCommand(window, tabClose.TRIGGER, {
        tabId: 999,
      });

      // Should not throw an error
      expect(true).toBe(true);
    });

    test('tab-duplicate: should forward partitionId to duplicateTab (issue #200)', async () => {
      const window = browser.activeWindow!;
      const result = browser.openURL('http://example.com', {
        partitionId: partitions.private.id,
      });
      expect(result).not.toBeNull();
      const sourceTab = window.selectedDesktop!.tabContainers[0].tabs[0];

      const duplicateSpy = vi.spyOn(browser, 'duplicateTab');

      await browser.performCommand(window, tabDuplicate.TRIGGER, {
        tabId: sourceTab.id,
        targetId: 'current-desktop-window',
        partitionId: sourceTab.partition.id,
      });

      expect(duplicateSpy).toHaveBeenCalledWith(
        sourceTab.id,
        expect.objectContaining({
          partitionId: partitions.private.id,
          targetId: 'current-desktop-window',
          selectTab: true,
        }),
      );
    });

    test('tab-suspend: should suspend the active tab', async () => {
      const window = browser.activeWindow!;
      const result = browser.openURL('https://example.com');

      // Get the created tab directly
      expect(result).not.toBeNull();
      const desktop = window.selectedDesktop!;
      const tabContainer = desktop.tabContainers[0];
      const tab = tabContainer.tabs[0];

      // Select the tab to make it active
      await window.selectTab(tab.id);

      const suspendTabSpy = vi.spyOn(window, 'suspendTab');

      // Pass empty object as params since command expects it
      await browser.performCommand(window, tabSuspend.TRIGGER, {});

      expect(suspendTabSpy).toHaveBeenCalledWith(tab.id);
    });

    test('tab-suspend: should suspend a specific tab by ID', async () => {
      const window = browser.activeWindow!;
      browser.openURL('https://example.com');
      browser.openURL('https://example2.com');
      const desktop = window.selectedDesktop!;
      const tab = desktop.tabContainers[0].tabs[0];
      const suspendTabSpy = vi.spyOn(window, 'suspendTab');

      await browser.performCommand(window, tabSuspend.TRIGGER, {
        tabId: tab.id,
      });

      expect(suspendTabSpy).toHaveBeenCalledWith(tab.id);
    });

    test('tab-suspend: should handle non-existent tab gracefully', async () => {
      const window = browser.activeWindow!;
      browser.openURL('https://example.com');

      await browser.performCommand(window, tabSuspend.TRIGGER, {
        tabId: 999,
      });

      // Should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('Tab Container Commands', () => {
    test('tabcontainer-select-by-index: should select tab container by index', async () => {
      const window = browser.activeWindow!;
      browser.openURL('https://example.com');
      browser.openURL('https://example2.com');
      const desktop = window.selectedDesktop!;
      const tabContainer = desktop.tabContainers[0];
      tabContainer.selectTab(tabContainer.tabs[0].id);
      const tab = tabContainer.selectedTab;
      const selectTabSpy = vi.spyOn(window, 'selectTab');

      await browser.performCommand(window, tabContainerSelectByIndex.TRIGGER, {
        index: 1,
      });

      expect(selectTabSpy).toHaveBeenCalledWith(tab?.id);
    });

    test('tabcontainer-select-by-index: should handle invalid index gracefully', async () => {
      const window = browser.activeWindow!;
      browser.openURL('https://example.com');

      await browser.performCommand(window, tabContainerSelectByIndex.TRIGGER, {
        index: 999,
      });

      // Should not throw an error
      expect(true).toBe(true);
    });

    test('tabcontainer-select-by-index: should handle tab container without selected tab', async () => {
      const window = browser.activeWindow!;
      browser.openURL('https://example.com');
      const desktop = window.selectedDesktop!;
      const tabContainer = desktop.tabContainers[0];

      // Mock scenario where tab container has no selected tab
      vi.spyOn(tabContainer, 'selectedTab', 'get').mockReturnValue(null);

      await browser.performCommand(window, tabContainerSelectByIndex.TRIGGER, {
        index: 1,
      });

      // Should not throw an error
      expect(true).toBe(true);
    });

    test('move-tab-container-up: reorders the selected tab container up in the list', async () => {
      const window = browser.activeWindow!;
      const a = await browser.openURL('https://a.com', { selectTab: true });
      const b = await browser.openURL('https://b.com', { selectTab: true });
      const desktop = window.selectedDesktop!;

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
        a!.tabContainer.id,
        b!.tabContainer.id,
      ]);

      await browser.performCommand(window, tabcontainerMoveUp.TRIGGER, {});

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
        b!.tabContainer.id,
        a!.tabContainer.id,
      ]);
    });

    test('move-tab-container-down: reorders the selected tab container down in the list', async () => {
      const window = browser.activeWindow!;
      const a = await browser.openURL('https://a.com', { selectTab: true });
      const b = await browser.openURL('https://b.com', { selectTab: true });
      const desktop = window.selectedDesktop!;

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
        a!.tabContainer.id,
        b!.tabContainer.id,
      ]);

      // After both opens, b is the selected one (at the bottom). Move it down
      // → it's already at the bottom, so it's a no-op. Re-select a, then move
      // it down.
      desktop.selectTabContainer(a!.tabContainer.id);
      await browser.performCommand(window, tabcontainerMoveDown.TRIGGER, {});

      expect(desktop.tabContainers.map((tc) => tc.id)).toEqual([
        b!.tabContainer.id,
        a!.tabContainer.id,
      ]);
    });
  });

  describe('Navigation Commands', () => {
    const setupTab = (browserInstance: Browser) => {
      const window = browserInstance.activeWindow!;
      const result = browserInstance.openURL('https://example.com');
      expect(result).not.toBeNull();
      const tab = window.selectedDesktop!.tabContainers[0].tabs[0];
      return { window, tab };
    };

    test('edit-url: should call clearFailLoad, cleanCertificateError, setLoading(false), loadURL in correct order (issue #201)', async () => {
      const { window, tab } = setupTab(browser);

      const clearFailLoadSpy = vi.spyOn(tab, 'clearFailLoad');
      const cleanCertSpy = vi.spyOn(tab, 'cleanCertificateError');
      const setLoadingSpy = vi.spyOn(tab, 'setLoading');
      const loadURLSpy = vi.spyOn(tab, 'loadURL');

      await browser.performCommand(window, urlEdit.TRIGGER, {
        tabId: tab.id,
        url: 'https://google.com',
      });

      expect(clearFailLoadSpy).toHaveBeenCalledTimes(1);
      expect(cleanCertSpy).toHaveBeenCalledTimes(1);
      expect(setLoadingSpy).toHaveBeenCalledTimes(1);
      expect(setLoadingSpy).toHaveBeenCalledWith(false);
      expect(loadURLSpy).toHaveBeenCalledTimes(1);
      expect(loadURLSpy).toHaveBeenCalledWith('https://google.com');

      expect(clearFailLoadSpy.mock.invocationCallOrder[0]).toBeLessThan(
        cleanCertSpy.mock.invocationCallOrder[0],
      );
      expect(cleanCertSpy.mock.invocationCallOrder[0]).toBeLessThan(
        setLoadingSpy.mock.invocationCallOrder[0],
      );
      expect(setLoadingSpy.mock.invocationCallOrder[0]).toBeLessThan(
        loadURLSpy.mock.invocationCallOrder[0],
      );
    });

    test('edit-url: should handle non-existent tab gracefully', async () => {
      const window = browser.activeWindow!;

      await browser.performCommand(window, urlEdit.TRIGGER, {
        tabId: 999,
        url: 'https://google.com',
      });

      expect(true).toBe(true);
    });

    test('reload-tab: should call clearFailLoad, cleanCertificateError, setLoading(false), reload in correct order', async () => {
      const { window, tab } = setupTab(browser);

      const clearFailLoadSpy = vi.spyOn(tab, 'clearFailLoad');
      const cleanCertSpy = vi.spyOn(tab, 'cleanCertificateError');
      const setLoadingSpy = vi.spyOn(tab, 'setLoading');
      const reloadSpy = vi.spyOn(tab, 'reload');

      await browser.performCommand(window, tabReload.TRIGGER, { tabId: tab.id });

      expect(clearFailLoadSpy).toHaveBeenCalledTimes(1);
      expect(cleanCertSpy).toHaveBeenCalledTimes(1);
      expect(setLoadingSpy).toHaveBeenCalledTimes(1);
      expect(setLoadingSpy).toHaveBeenCalledWith(false);
      expect(reloadSpy).toHaveBeenCalledTimes(1);

      expect(clearFailLoadSpy.mock.invocationCallOrder[0]).toBeLessThan(
        cleanCertSpy.mock.invocationCallOrder[0],
      );
      expect(cleanCertSpy.mock.invocationCallOrder[0]).toBeLessThan(
        setLoadingSpy.mock.invocationCallOrder[0],
      );
      expect(setLoadingSpy.mock.invocationCallOrder[0]).toBeLessThan(
        reloadSpy.mock.invocationCallOrder[0],
      );
    });

    test('reload-tab: should reload the active tab when no tabId is provided', async () => {
      const { window, tab } = setupTab(browser);
      await window.selectTab(tab.id);

      const reloadSpy = vi.spyOn(tab, 'reload');

      await browser.performCommand(window, tabReload.TRIGGER, {});

      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    test('reload-tab: should handle non-existent tab gracefully', async () => {
      const window = browser.activeWindow!;

      await browser.performCommand(window, tabReload.TRIGGER, { tabId: 999 });

      expect(true).toBe(true);
    });

    test('go-back: should call clearFailLoad, cleanCertificateError, goBack in correct order', async () => {
      const { window, tab } = setupTab(browser);

      const clearFailLoadSpy = vi.spyOn(tab, 'clearFailLoad');
      const cleanCertSpy = vi.spyOn(tab, 'cleanCertificateError');
      const goBackSpy = vi.spyOn(tab, 'goBack');

      await browser.performCommand(window, tabHistoryBack.TRIGGER, { tabId: tab.id });

      expect(clearFailLoadSpy).toHaveBeenCalledTimes(1);
      expect(cleanCertSpy).toHaveBeenCalledTimes(1);
      expect(goBackSpy).toHaveBeenCalledTimes(1);

      expect(clearFailLoadSpy.mock.invocationCallOrder[0]).toBeLessThan(
        cleanCertSpy.mock.invocationCallOrder[0],
      );
      expect(cleanCertSpy.mock.invocationCallOrder[0]).toBeLessThan(
        goBackSpy.mock.invocationCallOrder[0],
      );
    });

    test('go-forward: should call clearFailLoad, cleanCertificateError, goForward in correct order', async () => {
      const { window, tab } = setupTab(browser);

      const clearFailLoadSpy = vi.spyOn(tab, 'clearFailLoad');
      const cleanCertSpy = vi.spyOn(tab, 'cleanCertificateError');
      const goForwardSpy = vi.spyOn(tab, 'goForward');

      await browser.performCommand(window, tabHistoryForward.TRIGGER, { tabId: tab.id });

      expect(clearFailLoadSpy).toHaveBeenCalledTimes(1);
      expect(cleanCertSpy).toHaveBeenCalledTimes(1);
      expect(goForwardSpy).toHaveBeenCalledTimes(1);

      expect(clearFailLoadSpy.mock.invocationCallOrder[0]).toBeLessThan(
        cleanCertSpy.mock.invocationCallOrder[0],
      );
      expect(cleanCertSpy.mock.invocationCallOrder[0]).toBeLessThan(
        goForwardSpy.mock.invocationCallOrder[0],
      );
    });

    test('copy-url: should copy the tab URL to the clipboard and show it in the notification (issue #202)', async () => {
      const { window, tab } = setupTab(browser);

      const writeTextSpy = vi.spyOn(clipboard, 'writeText');
      const notificationSpy = vi.mocked(Notification);
      notificationSpy.mockClear();

      await browser.performCommand(window, urlCopy.TRIGGER, { tabId: tab.id });

      expect(writeTextSpy).toHaveBeenCalledTimes(1);
      expect(writeTextSpy).toHaveBeenCalledWith('https://example.com/');
      expect(notificationSpy).toHaveBeenCalledTimes(1);
      expect(notificationSpy).toHaveBeenCalledWith({
        title: 'URL Copied',
        body: 'https://example.com/',
      });
    });
  });

  describe('Command Visibility', () => {
    test('window-minimize: should be visible when window is not minimized', () => {
      const window = browser.activeWindow!;
      vi.spyOn(window.bw, 'isMinimized').mockReturnValue(false);

      const visibility = windowMinimize.Command.visibility!({
        browser,
        window,
        desktop: window.selectedDesktop,
        tabContainer: window.selectedDesktop?.selectedTabContainer || null,
        tab: window.selectedDesktop?.selectedTabContainer?.selectedTab || null,
      });

      expect(visibility).toBe(true);
    });

    test('window-minimize: should be hidden when window is already minimized', () => {
      const window = browser.activeWindow!;
      vi.spyOn(window.bw, 'isMinimized').mockReturnValue(true);

      const visibility = windowMinimize.Command.visibility!({
        browser,
        window,
        desktop: window.selectedDesktop,
        tabContainer: window.selectedDesktop?.selectedTabContainer || null,
        tab: window.selectedDesktop?.selectedTabContainer?.selectedTab || null,
      });

      expect(visibility).toBe(false);
    });

    test('tab-close: should be visible when tab exists', async () => {
      const window = browser.activeWindow!;
      const result = browser.openURL('https://example.com');

      // We need to check the actual tab
      expect(result).not.toBeNull();
      const desktop = window.selectedDesktop!;
      const tabContainer = desktop.tabContainers[0];
      const tab = tabContainer.tabs[0];

      // Select the tab to make it active
      await window.selectTab(tab.id);

      const visibility = tabClose.Command.visibility!({
        browser,
        window,
        desktop,
        tabContainer: desktop.selectedTabContainer || null,
        tab: desktop.selectedTabContainer?.selectedTab || null,
      });

      expect(visibility).toBe(true);
    });

    test('tab-close: should be hidden when no tab exists', () => {
      const window = browser.activeWindow!;

      const visibility = tabClose.Command.visibility!({
        browser,
        window,
        desktop: window.selectedDesktop,
        tabContainer: null,
        tab: null,
      });

      expect(visibility).toBe(false);
    });
  });

  describe('Command Metadata', () => {
    test('all commands should have required metadata', () => {
      const commands = [
        windowMinimize.Command,
        windowMaximize.Command,
        windowClose.Command,
        windowToggleSidebar.Command,
        windowToggleMaximizeArea.Command,
        desktopNext.Command,
        desktopPrev.Command,
        desktopSelect.Command,
        desktopRename.Command,
        desktopTheme.Command,
        tabNew.Command,
        tabNext.Command,
        tabPrev.Command,
        tabSuspend.Command,
        tabContainerSelectByIndex.Command,
        tabSelect.Command,
        tabClose.Command,
        tabReload.Command,
        tabHistoryBack.Command,
        tabHistoryForward.Command,
        urlEdit.Command,
      ];

      commands.forEach((command) => {
        expect(command.trigger).toBeDefined();
        expect(typeof command.trigger).toBe('string');
        expect(command.name).toBeDefined();
        expect(typeof command.name).toBe('function');
        expect(typeof command.name()).toBe('string');
        expect(command.description).toBeDefined();
        expect(typeof command.description).toBe('function');
        expect(typeof command.description()).toBe('string');
        expect(command.handler).toBeDefined();
        expect(typeof command.handler).toBe('function');
      });
    });

    test('commands with modals should have correct modal configuration', () => {
      const commandsWithModals = [
        desktopSelect.Command,
        desktopRename.Command,
        desktopTheme.Command,
      ];

      commandsWithModals.forEach((command) => {
        expect(command.modal).toBeDefined();
        expect(command.modal?.page).toBeDefined();
        expect(typeof command.modal?.page).toBe('string');
      });
    });
  });
});
