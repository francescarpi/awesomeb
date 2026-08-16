import { type IShortcutMap, EShortcutGroup } from '~/types';

export const SHORTCUTS_MAP: IShortcutMap = {
  id: 'generic-iso',
  name: 'Generic ISO',
  shortcuts: {
    preferences: {
      key: 'CmdOrCtrl+,',
      label: 'shortcuts.preferences.label',
      group: EShortcutGroup.General,
    },
    performCommand: {
      key: 'CmdOrCtrl+P',
      label: 'shortcuts.performCommand.label',
      group: EShortcutGroup.General,
    },
    toggleSidebar: {
      key: 'CmdOrCtrl+S',
      label: 'shortcuts.toggleSidebar.label',
      group: EShortcutGroup.General,
    },
    toggleMaximizeArea: {
      key: 'CmdOrCtrl+I',
      label: 'shortcuts.toggleMaximizeArea.label',
      group: EShortcutGroup.General,
    },
    goBack: {
      key: 'CmdOrCtrl+Left',
      label: 'shortcuts.goBack.label',
      group: EShortcutGroup.Navigation,
    },
    goForward: {
      key: 'CmdOrCtrl+Right',
      label: 'shortcuts.goForward.label',
      group: EShortcutGroup.Navigation,
    },
    copyUrl: {
      key: 'CmdOrCtrl+Shift+C',
      label: 'shortcuts.copyUrl.label',
      group: EShortcutGroup.Navigation,
    },
    editUrl: {
      key: 'CmdOrCtrl+E',
      label: 'shortcuts.editUrl.label',
      group: EShortcutGroup.Navigation,
    },
    findInPage: {
      key: 'CmdOrCtrl+F',
      label: 'shortcuts.findInPage.label',
      group: EShortcutGroup.Navigation,
    },
    newTab: {
      key: 'CmdOrCtrl+T',
      label: 'shortcuts.newTab.label',
      group: EShortcutGroup.TabManagement,
    },
    newWindow: {
      key: 'CmdOrCtrl+N',
      label: 'shortcuts.newWindow.label',
      group: EShortcutGroup.WindowManagement,
    },
    pasteAndGo: {
      key: '',
      label: 'shortcuts.pasteAndGo.label',
      group: EShortcutGroup.TabManagement,
    },
    openRecentlyClosed: {
      key: 'Shift+CmdOrCtrl+T',
      label: 'shortcuts.openRecentlyClosed.label',
      group: EShortcutGroup.TabManagement,
    },
    closeTab: {
      key: 'CmdOrCtrl+W',
      label: 'shortcuts.closeTab.label',
      group: EShortcutGroup.TabManagement,
    },
    reloadTab: {
      key: 'CmdOrCtrl+R',
      label: 'shortcuts.reloadTab.label',
      group: EShortcutGroup.TabManagement,
    },
    suspendTab: {
      key: 'CmdOrCtrl+Shift+S',
      label: 'shortcuts.suspendTab.label',
      group: EShortcutGroup.TabManagement,
    },
    moveTabUp: {
      key: 'CmdOrCtrl+Alt+]',
      label: 'shortcuts.moveTabUp.label',
      group: EShortcutGroup.TabManagement,
    },
    moveTabDown: {
      key: 'CmdOrCtrl+Alt+[',
      label: 'shortcuts.moveTabDown.label',
      group: EShortcutGroup.TabManagement,
    },
    selectTab1: {
      key: 'CmdOrCtrl+1',
      label: 'shortcuts.selectTab1.label',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab2: {
      key: 'CmdOrCtrl+2',
      label: 'shortcuts.selectTab2.label',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab3: {
      key: 'CmdOrCtrl+3',
      label: 'shortcuts.selectTab3.label',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab4: {
      key: 'CmdOrCtrl+4',
      label: 'shortcuts.selectTab4.label',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab5: {
      key: 'CmdOrCtrl+5',
      label: 'shortcuts.selectTab5.label',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab6: {
      key: 'CmdOrCtrl+6',
      label: 'shortcuts.selectTab6.label',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab7: {
      key: 'CmdOrCtrl+7',
      label: 'shortcuts.selectTab7.label',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab8: {
      key: 'CmdOrCtrl+8',
      label: 'shortcuts.selectTab8.label',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab9: {
      key: 'CmdOrCtrl+9',
      label: 'shortcuts.selectTab9.label',
      group: EShortcutGroup.TabNavigation,
    },
    previousTab: {
      key: 'CmdOrCtrl+]',
      label: 'shortcuts.previousTab.label',
      group: EShortcutGroup.TabNavigation,
    },
    nextTab: {
      key: 'CmdOrCtrl+[',
      label: 'shortcuts.nextTab.label',
      group: EShortcutGroup.TabNavigation,
    },
    findTab: {
      key: 'CmdOrCtrl+.',
      label: 'shortcuts.findTab.label',
      group: EShortcutGroup.TabNavigation,
    },
    tabSwitcher: {
      key: 'Control+Tab',
      label: 'shortcuts.tabSwitcher.label',
      group: EShortcutGroup.TabNavigation,
    },
    previousVisited: {
      key: "CmdOrCtrl+'",
      label: 'shortcuts.previousVisited.label',
      group: EShortcutGroup.TabNavigation,
    },
    tabMarks: {
      key: 'CmdOrCtrl+;',
      label: 'shortcuts.tabMarks.label',
      group: EShortcutGroup.TabNavigation,
    },
    selectTabAttention: {
      key: 'CmdOrCtrl+U',
      label: 'shortcuts.selectTabAttention.label',
      group: EShortcutGroup.TabNavigation,
    },
    zoomIn: { key: 'CmdOrCtrl+Plus', label: 'shortcuts.zoomIn.label', group: EShortcutGroup.Zoom },
    zoomOut: { key: 'CmdOrCtrl+-', label: 'shortcuts.zoomOut.label', group: EShortcutGroup.Zoom },
    zoomReset: {
      key: 'CmdOrCtrl+0',
      label: 'shortcuts.zoomReset.label',
      group: EShortcutGroup.Zoom,
    },
    findDesktop: {
      key: 'CmdOrCtrl+D',
      label: 'shortcuts.findDesktop.label',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop1: {
      key: 'Shift+CmdOrCtrl+1',
      label: 'shortcuts.selectDesktop1.label',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop2: {
      key: 'Shift+CmdOrCtrl+2',
      label: 'shortcuts.selectDesktop2.label',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop3: {
      key: 'Shift+CmdOrCtrl+3',
      label: 'shortcuts.selectDesktop3.label',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop4: {
      key: 'Shift+CmdOrCtrl+4',
      label: 'shortcuts.selectDesktop4.label',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop5: {
      key: 'Shift+CmdOrCtrl+5',
      label: 'shortcuts.selectDesktop5.label',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop6: {
      key: 'Shift+CmdOrCtrl+6',
      label: 'shortcuts.selectDesktop6.label',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop7: {
      key: 'Shift+CmdOrCtrl+7',
      label: 'shortcuts.selectDesktop7.label',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop8: {
      key: 'Shift+CmdOrCtrl+8',
      label: 'shortcuts.selectDesktop8.label',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop9: {
      key: 'Shift+CmdOrCtrl+9',
      label: 'shortcuts.selectDesktop9.label',
      group: EShortcutGroup.Desktops,
    },
    previousDesktop: {
      key: 'Shift+CmdOrCtrl+[',
      label: 'shortcuts.previousDesktop.label',
      group: EShortcutGroup.Desktops,
    },
    nextDesktop: {
      key: 'Shift+CmdOrCtrl+]',
      label: 'shortcuts.nextDesktop.label',
      group: EShortcutGroup.Desktops,
    },
    openBookmark: {
      key: 'CmdOrCtrl+B',
      label: 'shortcuts.openBookmark.label',
      group: EShortcutGroup.Bookmarks,
    },
  },
};
