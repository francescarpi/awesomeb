import { type Session } from 'electron';

export function sessionName(ses: Session): string {
  const p = ses.getStoragePath();
  if (!p) {
    return 'default';
  }
  const parts = p.split('/');
  return parts[parts.length - 1];
}
