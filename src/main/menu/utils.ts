import path from 'path';

export enum EIcon {
  Command = 'command.png',
  File = 'file.png',
}

export function getIcon(name: EIcon): string {
  return path.join(__dirname, '..', 'assets', 'icons', name);
}
