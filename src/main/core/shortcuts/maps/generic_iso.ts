import { type IShortcutMap, EShortcutGroup } from '~/types';
import { t } from '~/i18n';

export function getShortcuts(): IShortcutMap {
  return {
    id: 'generic-iso',
    name: 'Generic ISO',
    shortcuts: {
      preferences: {
        key: 'CmdOrCtrl+,',
        label: t('menu:app.preferences'),
        group: EShortcutGroup.General,
      },
      performCommand: {
        key: 'CmdOrCtrl+P',
        label: t('menu:file.performCommand'),
        group: EShortcutGroup.General,
      },
      toggleSidebar: {
        key: 'CmdOrCtrl+S',
        label: t('menu:window.toggleSidebar'),
        group: EShortcutGroup.General,
      },
      toggleMaximizeArea: {
        key: 'CmdOrCtrl+I',
        label: t('menu:window.toggleMaximizeArea'),
        group: EShortcutGroup.General,
      },
      goBack: {
        key: 'CmdOrCtrl+Left',
        label: t('menu:tabs.goBack'),
        group: EShortcutGroup.Navigation,
      },
      goForward: {
        key: 'CmdOrCtrl+Right',
        label: t('menu:tabs.goForward'),
        group: EShortcutGroup.Navigation,
      },
      copyUrl: {
        key: 'CmdOrCtrl+Shift+C',
        label: t('menu:edit.copyUrl'),
        group: EShortcutGroup.Navigation,
      },
      editUrl: {
        key: 'CmdOrCtrl+E',
        label: t('menu:edit.editUrl'),
        group: EShortcutGroup.Navigation,
      },
      findInPage: {
        key: 'CmdOrCtrl+F',
        label: t('menu:edit.findInPage'),
        group: EShortcutGroup.Navigation,
      },
      newTab: {
        key: 'CmdOrCtrl+T',
        label: t('menu:file.newTab'),
        group: EShortcutGroup.TabManagement,
      },
      newWindow: {
        key: 'CmdOrCtrl+N',
        label: t('menu:file.newWindow'),
        group: EShortcutGroup.WindowManagement,
      },
      pasteAndGo: {
        key: '',
        label: t('menu:file.pasteAndGo'),
        group: EShortcutGroup.TabManagement,
      },
      openRecentlyClosed: {
        key: 'Shift+CmdOrCtrl+T',
        label: t('menu:file.openRecentlyClosed'),
        group: EShortcutGroup.TabManagement,
      },
      closeTab: {
        key: 'CmdOrCtrl+W',
        label: t('menu:tabs.close'),
        group: EShortcutGroup.TabManagement,
      },
      reloadTab: {
        key: 'CmdOrCtrl+R',
        label: t('menu:tabs.reload'),
        group: EShortcutGroup.TabManagement,
      },
      suspendTab: {
        key: 'CmdOrCtrl+Shift+S',
        label: t('menu:tabs.suspend'),
        group: EShortcutGroup.TabManagement,
      },
      moveTabUp: {
        key: 'CmdOrCtrl+Alt+]',
        label: t('menu:tabs.moveUp'),
        group: EShortcutGroup.TabManagement,
      },
      moveTabDown: {
        key: 'CmdOrCtrl+Alt+[',
        label: t('menu:tabs.moveDown'),
        group: EShortcutGroup.TabManagement,
      },
      selectTab1: {
        key: 'CmdOrCtrl+1',
        label: t('menu:tabs.entry', { index: 1 }),
        group: EShortcutGroup.TabNavigation,
      },
      selectTab2: {
        key: 'CmdOrCtrl+2',
        label: t('menu:tabs.entry', { index: 2 }),
        group: EShortcutGroup.TabNavigation,
      },
      selectTab3: {
        key: 'CmdOrCtrl+3',
        label: t('menu:tabs.entry', { index: 3 }),
        group: EShortcutGroup.TabNavigation,
      },
      selectTab4: {
        key: 'CmdOrCtrl+4',
        label: t('menu:tabs.entry', { index: 4 }),
        group: EShortcutGroup.TabNavigation,
      },
      selectTab5: {
        key: 'CmdOrCtrl+5',
        label: t('menu:tabs.entry', { index: 5 }),
        group: EShortcutGroup.TabNavigation,
      },
      selectTab6: {
        key: 'CmdOrCtrl+6',
        label: t('menu:tabs.entry', { index: 6 }),
        group: EShortcutGroup.TabNavigation,
      },
      selectTab7: {
        key: 'CmdOrCtrl+7',
        label: t('menu:tabs.entry', { index: 7 }),
        group: EShortcutGroup.TabNavigation,
      },
      selectTab8: {
        key: 'CmdOrCtrl+8',
        label: t('menu:tabs.entry', { index: 8 }),
        group: EShortcutGroup.TabNavigation,
      },
      selectTab9: {
        key: 'CmdOrCtrl+9',
        label: t('menu:tabs.entry', { index: 9 }),
        group: EShortcutGroup.TabNavigation,
      },
      previousTab: {
        key: 'CmdOrCtrl+]',
        label: t('menu:tabs.previous'),
        group: EShortcutGroup.TabNavigation,
      },
      nextTab: {
        key: 'CmdOrCtrl+[',
        label: t('menu:tabs.next'),
        group: EShortcutGroup.TabNavigation,
      },
      findTab: {
        key: 'CmdOrCtrl+.',
        label: t('menu:tabs.find'),
        group: EShortcutGroup.TabNavigation,
      },
      tabSwitcher: {
        key: 'Control+Tab',
        label: t('menu:tabs.switcher'),
        group: EShortcutGroup.TabNavigation,
      },
      previousVisited: {
        key: "CmdOrCtrl+'",
        label: t('menu:tabs.previousVisited'),
        group: EShortcutGroup.TabNavigation,
      },
      tabMarks: {
        key: 'CmdOrCtrl+;',
        label: t('menu:tabs.marks'),
        group: EShortcutGroup.TabNavigation,
      },
      selectTabAttention: {
        key: 'CmdOrCtrl+U',
        label: t('menu:tabs.selectAttention'),
        group: EShortcutGroup.TabNavigation,
      },
      zoomIn: {
        key: 'CmdOrCtrl+Plus',
        label: t('menu:tabs.zoomIn'),
        group: EShortcutGroup.Zoom,
      },
      zoomOut: {
        key: 'CmdOrCtrl+-',
        label: t('menu:tabs.zoomOut'),
        group: EShortcutGroup.Zoom,
      },
      zoomReset: {
        key: 'CmdOrCtrl+0',
        label: t('menu:tabs.zoomReset'),
        group: EShortcutGroup.Zoom,
      },
      findDesktop: {
        key: 'CmdOrCtrl+D',
        label: t('menu:desktops.find'),
        group: EShortcutGroup.Desktops,
      },
      selectDesktop1: {
        key: 'Shift+CmdOrCtrl+1',
        label: t('menu:desktops.entry', { index: 1 }),
        group: EShortcutGroup.Desktops,
      },
      selectDesktop2: {
        key: 'Shift+CmdOrCtrl+2',
        label: t('menu:desktops.entry', { index: 2 }),
        group: EShortcutGroup.Desktops,
      },
      selectDesktop3: {
        key: 'Shift+CmdOrCtrl+3',
        label: t('menu:desktops.entry', { index: 3 }),
        group: EShortcutGroup.Desktops,
      },
      selectDesktop4: {
        key: 'Shift+CmdOrCtrl+4',
        label: t('menu:desktops.entry', { index: 4 }),
        group: EShortcutGroup.Desktops,
      },
      selectDesktop5: {
        key: 'Shift+CmdOrCtrl+5',
        label: t('menu:desktops.entry', { index: 5 }),
        group: EShortcutGroup.Desktops,
      },
      selectDesktop6: {
        key: 'Shift+CmdOrCtrl+6',
        label: t('menu:desktops.entry', { index: 6 }),
        group: EShortcutGroup.Desktops,
      },
      selectDesktop7: {
        key: 'Shift+CmdOrCtrl+7',
        label: t('menu:desktops.entry', { index: 7 }),
        group: EShortcutGroup.Desktops,
      },
      selectDesktop8: {
        key: 'Shift+CmdOrCtrl+8',
        label: t('menu:desktops.entry', { index: 8 }),
        group: EShortcutGroup.Desktops,
      },
      selectDesktop9: {
        key: 'Shift+CmdOrCtrl+9',
        label: t('menu:desktops.entry', { index: 9 }),
        group: EShortcutGroup.Desktops,
      },
      previousDesktop: {
        key: 'Shift+CmdOrCtrl+[',
        label: t('menu:desktops.previous'),
        group: EShortcutGroup.Desktops,
      },
      nextDesktop: {
        key: 'Shift+CmdOrCtrl+]',
        label: t('menu:desktops.next'),
        group: EShortcutGroup.Desktops,
      },
      openBookmark: {
        key: 'CmdOrCtrl+B',
        label: t('menu:bookmarks.open'),
        group: EShortcutGroup.Bookmarks,
      },
    },
  };
}
