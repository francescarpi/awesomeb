import type { IExtension, IExtensionManifest, IExtensionAction } from '@/core/extensions/schemes';

export interface IExtensions {
  path: string;
  extensions: IExtension[];
}

export type TExtensionId = string;

export type { IExtension, IExtensionManifest, IExtensionAction };
