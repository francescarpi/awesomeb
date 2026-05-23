import { z } from 'zod';

// Chrome extension manifests have many optional fields.
// We validate the fields we care about but allow passthrough
// for any additional Chrome-specific properties.
export const ExtensionActionScheme = z
  .object({
    default_icon: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
    default_popup: z.string().optional(),
    default_title: z.string().optional(),
    browser_style: z.boolean().optional(),
  })
  .passthrough();

export const ExtensionManifestScheme = z
  .object({
    action: ExtensionActionScheme.optional(),
    description: z.string(),
    homepage_url: z.string().optional(),
    host_permissions: z.array(z.string()).optional(),
    icons: z.record(z.string(), z.string()).optional(),
    key: z.string().optional(),
    manifest_version: z.number(),
    name: z.string(),
    permissions: z.array(z.string()).optional(),
    update_url: z.string().optional(),
    version: z.string(),
  })
  .passthrough();

export const ExtensionScheme = z
  .object({
    id: z.string(),
    manifest: ExtensionManifestScheme,
    manifestPath: z.string(),
    icon: z.string().nullable().optional(),
    enabled: z.boolean(),
  })
  .strict();

export const ExtensionsStoreScheme = z
  .object({
    extensions: z.record(z.string(), ExtensionScheme),
  })
  .strict();

export type IExtension = z.infer<typeof ExtensionScheme>;
export type IExtensionManifest = z.infer<typeof ExtensionManifestScheme>;
export type IExtensionAction = z.infer<typeof ExtensionActionScheme>;
export type IExtensionsStore = z.infer<typeof ExtensionsStoreScheme>;
