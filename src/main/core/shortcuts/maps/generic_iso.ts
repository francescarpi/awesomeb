import { type IShortcutMap, EShortcutGroup } from '~/types';

export const SHORTCUTS_MAP: IShortcutMap = {
  id: 'generic-iso',
  name: 'Generic ISO',
  shortcuts: {
    preferences: {
      key: 'CmdOrCtrl+,',
      label: 'menu:app.preferences',
      group: EShortcutGroup.General,
    },
    performCommand: {
      key: 'CmdOrCtrl+P',
      label: 'menu:file.performCommand',
      group: EShortcutGroup.General,
    },
    toggleSidebar: {
      key: 'CmdOrCtrl+S',
      label: 'menu:window.toggleSidebar',
      group: EShortcutGroup.General,
    },
    toggleMaximizeArea: {
      key: 'CmdOrCtrl+I',
      label: 'menu:window.toggleMaximizeArea',
      group: EShortcutGroup.General,
    },
    goBack: {
      key: 'CmdOrCtrl+Left',
      label: 'menu:tabs.goBack',
      group: EShortcutGroup.Navigation,
    },
    goForward: {
      key: 'CmdOrCtrl+Right',
      label: 'menu:tabs.goForward',
      group: EShortcutGroup.Navigation,
    },
    copyUrl: {
      key: 'CmdOrCtrl+Shift+C',
      label: 'menu:edit.copyUrl',
      group: EShortcutGroup.Navigation,
    },
    editUrl: {
      key: 'CmdOrCtrl+E',
      label: 'menu:edit.editUrl',
      group: EShortcutGroup.Navigation,
    },
    findInPage: {
      key: 'CmdOrCtrl+F',
      label: 'menu:edit.findInPage',
      group: EShortcutGroup.Navigation,
    },
    newTab: {
      key: 'CmdOrCtrl+T',
      label: 'menu:file.newTab',
      group: EShortcutGroup.TabManagement,
    },
    newWindow: {
      key: 'CmdOrCtrl+N',
      label: 'menu:file.newWindow',
      group: EShortcutGroup.WindowManagement,
    },
    pasteAndGo: {
      key: '',
      label: 'menu:file.pasteAndGo',
      group: EShortcutGroup.TabManagement,
    },
    openRecentlyClosed: {
      key: 'Shift+CmdOrCtrl+T',
      label: 'menu:file.openRecentlyClosed',
      group: EShortcutGroup.TabManagement,
    },
    closeTab: {
      key: 'CmdOrCtrl+W',
      label: 'menu:tabs.close',
      group: EShortcutGroup.TabManagement,
    },
    reloadTab: {
      key: 'CmdOrCtrl+R',
      label: 'menu:tabs.reload',
      group: EShortcutGroup.TabManagement,
    },
    suspendTab: {
      key: 'CmdOrCtrl+Shift+S',
      label: 'menu:tabs.suspend',
      group: EShortcutGroup.TabManagement,
    },
    moveTabUp: {
      key: 'CmdOrCtrl+Alt+]',
      label: 'menu:tabs.moveUp',
      group: EShortcutGroup.TabManagement,
    },
    moveTabDown: {
      key: 'CmdOrCtrl+Alt+[',
      label: 'menu:tabs.moveDown',
      group: EShortcutGroup.TabManagement,
    },
    selectTab1: {
      key: 'CmdOrCtrl+1',
      label: 'menu:tabs.entry',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab2: {
      key: 'CmdOrCtrl+2',
      label: 'menu:tabs.entry',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab3: {
      key: 'CmdOrCtrl+3',
      label: 'menu:tabs.entry',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab4: {
      key: 'CmdOrCtrl+4',
      label: 'menu:tabs.entry',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab5: {
      key: 'CmdOrCtrl+5',
      label: 'menu:tabs.entry',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab6: {
      key: 'CmdOrCtrl+6',
      label: 'menu:tabs.entry',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab7: {
      key: 'CmdOrCtrl+7',
      label: 'menu:tabs.entry',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab8: {
      key: 'CmdOrCtrl+8',
      label: 'menu:tabs.entry',
      group: EShortcutGroup.TabNavigation,
    },
    selectTab9: {
      key: 'CmdOrCtrl+9',
      label: 'menu:tabs.entry',
      group: EShortcutGroup.TabNavigation,
    },
    previousTab: {
      key: 'CmdOrCtrl+]',
      label: 'menu:tabs.previous',
      group: EShortcutGroup.TabNavigation,
    },
    nextTab: {
      key: 'CmdOrCtrl+[',
      label: 'menu:tabs.next',
      group: EShortcutGroup.TabNavigation,
    },
    findTab: {
      key: 'CmdOrCtrl+.',
      label: 'menu:tabs.find',
      group: EShortcutGroup.TabNavigation,
    },
    tabSwitcher: {
      key: 'Control+Tab',
      label: 'menu:tabs.switcher',
      group: EShortcutGroup.TabNavigation,
    },
    previousVisited: {
      key: "CmdOrCtrl+'",
      label: 'menu:tabs.previousVisited',
      group: EShortcutGroup.TabNavigation,
    },
    tabMarks: {
      key: 'CmdOrCtrl+;',
      label: 'menu:tabs.marks',
      group: EShortcutGroup.TabNavigation,
    },
    selectTabAttention: {
      key: 'CmdOrCtrl+U',
      label: 'menu:tabs.selectAttention',
      group: EShortcutGroup.TabNavigation,
    },
    zoomIn: {
      key: 'CmdOrCtrl+Plus',
      label: 'menu:tabs.zoomIn',
      group: EShortcutGroup.Zoom,
    },
    zoomOut: {
      key: 'CmdOrCtrl+-',
      label: 'menu:tabs.zoomOut',
      group: EShortcutGroup.Zoom,
    },
    zoomReset: {
      key: 'CmdOrCtrl+0',
      label: 'menu:tabs.zoomReset',
      group: EShortcutGroup.Zoom,
    },
    findDesktop: {
      key: 'CmdOrCtrl+D',
      label: 'menu:desktops.find',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop1: {
      key: 'Shift+CmdOrCtrl+1',
      label: 'Desktop 1',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop2: {
      key: 'Shift+CmdOrCtrl+2',
      label: 'Desktop 2',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop3: {
      key: 'Shift+CmdOrCtrl+3',
      label: 'Desktop 3',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop4: {
      key: 'Shift+CmdOrCtrl+4',
      label: 'Desktop 4',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop5: {
      key: 'Shift+CmdOrCtrl+5',
      label: 'Desktop 5',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop6: {
      key: 'Shift+CmdOrCtrl+6',
      label: 'Desktop 6',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop7: {
      key: 'Shift+CmdOrCtrl+7',
      label: 'Desktop 7',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop8: {
      key: 'Shift+CmdOrCtrl+8',
      label: 'Desktop 8',
      group: EShortcutGroup.Desktops,
    },
    selectDesktop9: {
      key: 'Shift+CmdOrCtrl+9',
      label: 'Desktop 9',
      group: EShortcutGroup.Desktops,
    },
    previousDesktop: {
      key: 'Shift+CmdOrCtrl+[',
      label: 'menu:desktops.previous',
      group: EShortcutGroup.Desktops,
    },
    nextDesktop: {
      key: 'Shift+CmdOrCtrl+]',
      label: 'menu:desktops.next',
      group: EShortcutGroup.Desktops,
    },
    openBookmark: {
      key: 'CmdOrCtrl+B',
      label: 'menu:bookmarks.open',
      group: EShortcutGroup.Bookmarks,
    },
  },
};
