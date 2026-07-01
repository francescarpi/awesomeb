export type TDesktopId = number;

export interface ITheme {
  primary: string;
  secondary: string;
  degrees: number;
}

export interface IDesktop {
  id: TDesktopId;
  shortName: string | null;
  longName: string | null;
  selected: boolean;
  requireAttention: boolean;
  hasTabs: boolean;
  hasActiveTabs: boolean;
}
