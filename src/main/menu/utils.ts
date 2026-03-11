import path from 'path';

export enum EIcon {
  Back = 'back.png',
  Bookmarks = 'bookmarks.png',
  Close = 'close.png',
  Command = 'command.png',
  Copy = 'copy.png',
  Desktop = 'desktop.png',
  Divider = 'divider.png',
  Down = 'down.png',
  Edit = 'edit.png',
  File = 'file.png',
  Folder = 'folder.png',
  Forward = 'forward.png',
  Logo = 'logo.png',
  Maximize = 'maximize.png',
  Move = 'move.png',
  Mute = 'mute.png',
  Next = 'next.png',
  Notification = 'notification.png',
  Open = 'open.png',
  Partition = 'partition.png',
  Previous = 'previous.png',
  Reload = 'reload.png',
  Search = 'search.png',
  Sidebar = 'sidebar.png',
  Suspend = 'suspend.png',
  Tab = 'tab.png',
  Theme = 'theme.png',
  Unmute = 'unmute.png',
  Up = 'up.png',
  Windows = 'windows.png',
}

export function getIcon(name: EIcon): string {
  return path.join(__dirname, 'assets', 'icons', name);
}
