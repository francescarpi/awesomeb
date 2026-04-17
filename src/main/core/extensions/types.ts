import { TExtensionId, IExtension } from '~/types';

export interface IExtensionsStore {
  extensions: Record<TExtensionId, IExtension>;
}
