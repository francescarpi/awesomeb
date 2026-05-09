export type TDesktopId = number;

export interface ITheme {
  primary: string;
  secondary: string;
  degrees: number;
}

export interface IVisibleDesktop {
  id: TDesktopId;
  name: string | null;
  selected: boolean;
  requireAttention: boolean;
  hasTabs: boolean;
  hasActiveTabs: boolean;
}

export interface IVisibleDesktops {
  hasLess: boolean;
  hasMore: boolean;
  desktops: IVisibleDesktop[];
}
