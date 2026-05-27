export type TDesktopId = number;

export interface ITheme {
  primary: string;
  secondary: string;
  degrees: number;
}

export interface IDesktop {
  id: TDesktopId;
  name: string | null;
  selected: boolean;
  requireAttention: boolean;
  hasTabs: boolean;
  hasActiveTabs: boolean;
}
