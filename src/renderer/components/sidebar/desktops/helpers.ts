import { type IDesktopEntity } from '~/types';

export function desktopContainerClasses(desktop: IDesktopEntity): string {
  const classes = ['group', 'relative', 'hidden', 'sidebar:block', '[.selected]:block'];
  if (desktop.selected) {
    classes.push('selected');
  }
  return classes.join(' ');
}

export function desktopClasses(desktop: IDesktopEntity): string {
  const classes = [
    'border',
    'rounded-full',
    'sidebar:w-9',
    'sidebar:h-9',
    'sidebar:text-sm',
    'w-7',
    'h-7',
    'text-xs',
    'cursor-pointer',
    'sidebar:flex',
    'items-center',
    'justify-center',
    'flex',
    'select-none',
  ];
  if (desktop.selected) {
    classes.push('bg-white/20');
  }
  return classes.join(' ');
}

export function indicatorClasses(desktop: IDesktopEntity): string {
  const classes = [
    'w-[3px]',
    'h-[3px]',
    'rounded-full',
    'absolute',
    'bottom-1',
    'left-1/2',
    '-translate-x-1/2',
  ];

  if (desktop.hasActiveTabs) {
    classes.push('bg-white');
  } else if (desktop.hasTabs) {
    classes.push('bg-white/20');
  } else {
    classes.push('hidden');
  }
  return classes.join(' ');
}

export function attentionClasses(desktop: IDesktopEntity): string {
  const classes = ['w-2', 'h-2', 'bg-red-500', 'rounded-full', 'absolute', 'right-0', 'top-0'];

  if (!desktop.requireAttention) {
    classes.push('hidden');
  }

  return classes.join(' ');
}

export function attentionPingClasses(desktop: IDesktopEntity): string {
  const classes = [
    'w-3',
    'h-3',
    'bg-red-500',
    'rounded-full',
    'animate-ping',
    'absolute',
    '-right-0.5',
    '-top-0.5',
  ];

  if (!desktop.requireAttention) {
    classes.push('hidden');
  }

  return classes.join(' ');
}

export function nameClasses(): string {
  const classes = [
    'text-[10px]',
    'absolute',
    'mt-1',
    'whitespace-nowrap',
    'left-1/2',
    '-translate-x-1/2',
    'sidebar:hidden',
    'sidebar:group-[.selected]:block',
    'sidebar:group-hover:block',
  ];

  return classes.join(' ');
}
