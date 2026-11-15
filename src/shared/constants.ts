export const INTERNAL_PROTOCOL = 'awesomeb';

export const ALLOWED_PAGES: string[] = [
  'bookmarks',
  'downloads',
  'settings',
  'extensions',
  'history',
  'debug',
];

export const UI_THEMES = [
  'cupcake',
  'light',
  'dark',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset',
  'caramellatte',
  'abyss',
  'slik',
] as const;

export const DEFAULT_UI_THEME = 'cupcake';

export const MAX_SPLIT_TABS = 3;

export const MAX_TAB_NAME_LENGTH = 50;

export const DEFAULT_SHORTCUTS_MAP = 'generic-ansi';

export const URLBAR_HEIGHT = 24;

export const LAYOUT_MARGIN = 5;

export const EXTENSION_ICON_SIZE = 20;

export const EXTENSION_POPUP_GAP = 16;

export const SIDEBAR_DEFAULT_WIDTH = 255;
export const SIDEBAR_MIN_WIDTH = 40;

export const BORDER_WIDTH = 2;

// Duration (ms) of the animated layout transitions (sidebar toggle, area
// maximize). Shared between the main process (bounds interpolation) and the
// renderer (CSS transition) so both stay in sync.
export const LAYOUT_ANIMATION_DURATION = 200;

// Easing used for the layout transitions, as a CSS timing function. The main
// process uses the equivalent cubic bezier (see `easeInOut` in src/main/ui/view.ts)
// so the interpolated bounds and the CSS transition follow the same curve.
export const LAYOUT_ANIMATION_EASING = 'cubic-bezier(0.42, 0, 0.58, 1)';
