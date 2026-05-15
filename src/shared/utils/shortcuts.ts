export function isMacPlatform(): boolean {
  if (typeof navigator !== 'undefined') return /mac/i.test(navigator.platform);
  if (typeof process !== 'undefined') return process.platform === 'darwin';
  return false;
}

export function acceleratorToDisplay(accelerator: string, platform?: 'mac' | 'win'): string {
  const isMac = platform !== undefined ? platform === 'mac' : isMacPlatform();
  const parts = accelerator.split('+');

  const displayParts = parts.map((part) => {
    const lower = part.toLowerCase();

    if (lower === 'cmdorctrl' || lower === 'command' || lower === 'cmd')
      return isMac ? '\u2318' : 'Ctrl';
    if (lower === 'ctrl' || lower === 'control') return isMac ? '\u2303' : 'Ctrl';
    if (lower === 'alt') return isMac ? '\u2325' : 'Alt';
    if (lower === 'shift') return isMac ? '\u21E7' : 'Shift';

    switch (lower) {
      case 'plus':
        return '+';
      case 'left':
        return '\u2190';
      case 'right':
        return '\u2192';
      case 'up':
        return '\u2191';
      case 'down':
        return '\u2193';
      case 'space':
        return 'Space';
      case 'tab':
        return 'Tab';
      case 'escape':
        return 'Esc';
      case 'enter':
        return 'Enter';
      case 'delete':
        return 'Del';
      case 'backspace':
        return 'Bksp';
      case 'home':
        return 'Home';
      case 'end':
        return 'End';
      case 'pageup':
        return 'PgUp';
      case 'pagedown':
        return 'PgDn';
      default:
        return part;
    }
  });

  return isMac ? displayParts.join('') : displayParts.join('+');
}

export function keyEventToAccelerator(event: KeyboardEvent): string | null {
  event.preventDefault();
  event.stopPropagation();

  const modifiers: string[] = [];
  if (event.metaKey) modifiers.push('Cmd');
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');

  const KEY_MAP: Record<string, string | null> = {
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ' ': 'Space',
    '\t': 'Tab',
    Escape: null,
    Enter: 'Enter',
    Delete: 'Del',
    Backspace: 'Bksp',
    Home: 'Home',
    End: 'End',
    PageUp: 'PgUp',
    PageDown: 'PgDn',
  };

  const mappedKey = KEY_MAP[event.key];
  if (mappedKey !== undefined) {
    if (mappedKey === null) return null;
    return [...modifiers, mappedKey].join('+');
  }

  if (event.key.startsWith('F') && event.key.length >= 2 && event.key.length <= 3) {
    return [...modifiers, event.key].join('+');
  }

  if (event.key === '+') {
    return [...modifiers, 'Plus'].join('+');
  }

  if (event.key.length === 1) {
    return [...modifiers, event.key.toUpperCase()].join('+');
  }

  return null;
}
