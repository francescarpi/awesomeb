import type { TWindowId } from './window';

export interface IDebugWebContent {
  winId: TWindowId;
  url: string;
  title: string;
  pid: number;
  visible: boolean;
  memory: string;
  memoryValue: number;
  cpu: string;
  cpuValue: number;
  preloads: { filePath: string; type: string }[];
  partition: {
    persistent: boolean;
    name: string;
  };
}
