import { Partition } from '../partitions';
import { Certificate } from 'electron';
import { Tab } from './tab';
import type { TTabContainerId } from '~/types';

export interface ITabContainerProps {
  divider?: boolean;
  justAfter?: TTabContainerId;
}

export interface ITabProps {
  partition: Partition;
  title?: string | null;
  customTitle?: string | null;
  url?: string | null;
  suspended?: boolean;
  parent?: Tab;
  favicon?: string | null;
}

export type TBasicAuthCallback = (username?: string, password?: string) => void;

export type TCertificateCallback = (certificate: Certificate) => void;

export type TPermissionRequestCallback = (granted: boolean) => void;
