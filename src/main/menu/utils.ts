import path from 'path';

export enum EIcon {
  Command = 'command.png',
  Desktop = 'desktop.png',
  Edit = 'edit.png',
  File = 'file.png',
  Maximize = 'maximize.png',
  Next = 'next.png',
  Previous = 'previous.png',
  Sidebar = 'sidebar.png',
  Tab = 'tab.png',
  Theme = 'theme.png',
  Windows = 'windows.png',
}

export function getIcon(name: EIcon): string {
  return path.join(__dirname, 'assets', 'icons', name);
}
