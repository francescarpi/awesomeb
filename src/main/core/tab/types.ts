import { Partition } from '../partitions';

export interface ITabContainerProps {
  divider?: boolean;
}

export interface ITabProps {
  partition: Partition;
  title?: string | null;
  customTitle?: string | null;
  url?: string | null;
}
