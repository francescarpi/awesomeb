import { IEntity, IDesktopEntity, IThemeEntity, IPartitionEntity, ITabContainer } from '~/types';
import { Browser, config, getCommands, getPartitions, getThemes, Window } from '@/core';

export class BrowserRenderer {
  constructor(private readonly _browser: Browser) {}

  commands(): IEntity[] {
    return getCommands(this._browser).map((cmd) => ({
      id: cmd.trigger,
      label: cmd.name,
      extra: cmd.description,
    }));
  }

  desktops(window: Window): IDesktopEntity[] {
    return window.desktops.map((desk) => ({
      id: desk.id.toString(),
      label: desk.label,
      selected: desk.id === window.selectedDesktop.id,
      requireAttention: desk.requireAttention,
      hasTabs: desk.hasTabs,
      hasActiveTabs: desk.hasActiveTabs,
      name: desk.name,
    }));
  }

  themes(window: Window): IThemeEntity[] {
    const themes = getThemes();

    const selectedDesktop = window.selectedDesktop;
    const result: IThemeEntity[] = [];

    for (const [name, theme] of themes.entries()) {
      result.push({
        id: name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        selected: selectedDesktop.theme?.name === name,
        primary: theme.primary,
        secondary: theme.secondary,
        degrees: theme.degrees,
      });
    }

    return result;
  }

  searchEngines(): IEntity[] {
    const searchEngines = config.getProperty('searchEngines');

    return searchEngines.map((engine) => ({
      id: engine.code,
      label: engine.label,
    }));
  }

  partitions(): IPartitionEntity[] {
    const partitions = getPartitions();
    return Array.from(partitions.values()).map((partition) => ({
      id: partition.id,
      label: partition.name,
      color: partition.color,
    }));
  }

  targets(browser: Browser, window: Window): IEntity[] {
    const result = [
      {
        id: 'current-desktop-window',
        label: 'Current desktop & window',
      },
      {
        id: 'into-selected-tab-container',
        label: 'Split into selected tab',
      },
      {
        id: 'new-window',
        label: 'New window',
      },
      {
        id: 'new-window-left',
        label: 'New left window',
      },
      {
        id: 'new-window-right',
        label: 'New right window',
      },
    ];

    for (const win of browser.windows) {
      result.push({
        id: `window-${win.id}`,
        label: `Window ${win.id}`,
      });
    }

    for (const desk of window.desktops) {
      result.push({
        id: `desktop-${desk.id}`,
        label: desk.label,
      });
    }

    return result;
  }

  tabContainers(window: Window): ITabContainer[] {
    const desktop = window.selectedDesktop;
    const selectedTabContainer = desktop.selectedTabContainer;

    return desktop.tabContainers.map((tc) => ({
      id: tc.id,
      selected: selectedTabContainer?.id === tc.id,
      divider: tc.divider,
      tabs: tc.tabs.map((tab) => ({
        id: tab.id,
        desktopId: desktop.id,
        windowId: window.id,
        title: tab.title,
        url: tab.url,
        selected: selectedTabContainer?.selectedTab?.id === tab.id,
        partition: {
          name: tab.partition.name,
          color: tab.partition.color,
          private: tab.partition.private,
        },
        suspended: tab.suspended,
        loading: tab.loading,
        favicon: tab.favicon,
        hasTabPreview: tab.hasTabPreview,
        requireAttention: tab.requireAttention,
      })),
    }));
  }
}
