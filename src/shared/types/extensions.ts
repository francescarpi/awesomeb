export interface IExtensions {
  path: string;
  extensions: IExtension[];
}

export type TExtensionId = string;

export interface IExtension {
  id: TExtensionId;
  manifest: IExtensionManifest;
  manifestPath: string;
  icon: string | null;
  enabled: boolean;
}

export interface IExtensionAction {
  default_icon: string | Record<string, string>;
  default_popup: string;
}

export interface IExtensionManifest {
  action: IExtensionAction;
  description: string;
  homepage_url: string;
  host_permissions: string[];
  icons: Record<string, string>;
  key: string;
  manifest_version: number;
  name: string;
  permissions: string[];
  udpate_url: string;
  version: string;
}
