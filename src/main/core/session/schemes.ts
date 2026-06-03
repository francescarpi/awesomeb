import { z } from 'zod';

export const RectangleScheme = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .strict();

export const SessionTabScheme = z
  .object({
    id: z.number(),
    partitionId: z.string(),
    title: z.string().nullable(),
    customTitle: z.string().nullable(),
    url: z.string().nullable(),
    favicon: z.string().nullable(),
    closedAt: z.number().nullable(),
  })
  .strict();

export const SessionTabContainerScheme = z
  .object({
    id: z.number(),
    divider: z.boolean(),
    tabs: z.array(SessionTabScheme),
  })
  .strict();

export const SessionDesktopScheme = z
  .object({
    id: z.number(),
    name: z.string().nullable(),
    theme: z.string(),
    tabContainers: z.array(SessionTabContainerScheme),
  })
  .strict();

export const SessionWindowScheme = z
  .object({
    id: z.number(),
    bounds: RectangleScheme,
    selectedDesktopId: z.number(),
    sidebarCollapsed: z.boolean(),
    areaMaximized: z.boolean(),
    desktops: z.array(SessionDesktopScheme),
  })
  .strict();

export const SessionStoreScheme = z
  .object({
    windows: z.array(SessionWindowScheme),
  })
  .strict();

export type ISessionStore = z.infer<typeof SessionStoreScheme>;
export type ISessionWindow = z.infer<typeof SessionWindowScheme>;
