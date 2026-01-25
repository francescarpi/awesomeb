export interface IConfigPartition {
  name: string;
  color: string;
  id: string;
}

export interface IConfigSearchEngine {
  code: string;
  label: string;
  url: string;
}

export interface IConfigTheme {
  name: string;
  primary: string;
  secondary: string;
  degrees: number;
}
