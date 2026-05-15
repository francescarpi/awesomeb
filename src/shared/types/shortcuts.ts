export type TShortcutMapId = string;
export type TShortcutId = string;

export interface IShortcutMap {
  id: TShortcutMapId;
  name: string;
  shortcuts: Record<TShortcutId, IShortcut>;
}

export interface IShortcut {
  key: string;
  label: string;
  group: EShortcutGroup;
}

export enum EShortcutGroup {
  General = 'General',
  Navigation = 'Navigation',
  TabManagement = 'Tab Management',
  TabNavigation = 'Tab Navigation',
  Zoom = 'Zoom',
  Desktops = 'Desktops',
  Bookmarks = 'Bookmarks',
}
