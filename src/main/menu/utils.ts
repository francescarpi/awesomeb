import path from 'path';

export enum EIcon {
  Back = 'back.png',
  Close = 'close.png',
  Command = 'command.png',
  Copy = 'copy.png',
  Desktop = 'desktop.png',
  Divider = 'divider.png',
  Edit = 'edit.png',
  File = 'file.png',
  Forward = 'forward.png',
  Maximize = 'maximize.png',
  Next = 'next.png',
  Notification = 'notification.png',
  Previous = 'previous.png',
  Reload = 'reload.png',
  Search = 'search.png',
  Sidebar = 'sidebar.png',
  Suspend = 'suspend.png',
  Tab = 'tab.png',
  Theme = 'theme.png',
  Windows = 'windows.png',
}

export function getIcon(name: EIcon): string {
  return path.join(__dirname, 'assets', 'icons', name);
}
