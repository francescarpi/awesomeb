import { Partition } from '../partitions';
import { Certificate } from 'electron';

export interface ITabContainerProps {
  divider?: boolean;
}

export interface ITabProps {
  partition: Partition;
  title?: string | null;
  customTitle?: string | null;
  url?: string | null;
  suspended?: boolean;
}

export type TBasicAuthCallback = (username?: string, password?: string) => void;

export type TCertificateCallback = (certificate: Certificate) => void;

export type TPermissionRequestCallback = (granted: boolean) => void;
