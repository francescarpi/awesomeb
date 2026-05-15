import type { TShortcutMapId, TShortcutId } from '~/types';

export interface IShortcutMap {
  id: TShortcutMapId;
  name: string;
  shortcuts: Record<TShortcutId, IShortcut>;
}

export interface IShortcut {
  key: string;
  label: string;
}
