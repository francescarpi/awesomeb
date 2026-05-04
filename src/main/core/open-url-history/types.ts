export interface IOpenUrlHistory {
  urls: string[];
}

export type TFindUrlResult = { value: string; range: [number, number] };
