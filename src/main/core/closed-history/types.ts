export interface IClosedHistory {
  tabs: IClosedTab[];
}

export interface IClosedTab {
  title: string;
  url: string;
  timestamp: number;
}
