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
    openTabsAsChild: z.boolean().default(false),
  })
  .strict();

export type ISessionTab = z.infer<typeof SessionTabScheme>;

export type ISessionTabContainer = {
  id: number;
  divider: boolean;
  childrenCollapsed: boolean;
  tabs: z.infer<typeof SessionTabScheme>[];
  children: ISessionTabContainer[];
};

export const SessionTabContainerScheme: z.ZodType<ISessionTabContainer> = z.lazy(() =>
  z
    .object({
      id: z.number(),
      divider: z.boolean(),
      childrenCollapsed: z.boolean().default(false),
      tabs: z.array(SessionTabScheme),
      children: z.array(SessionTabContainerScheme).default([]),
    })
    .strict(),
);

export const SessionDesktopScheme = z
  .object({
    id: z.number(),
    shortName: z.string().nullable().optional(),
    longName: z.string().nullable().optional(),
    name: z.string().nullable().optional(), // legacy: kept for read-time migration only, never emitted by new sessions
    theme: z.string(),
    tabContainers: z.array(SessionTabContainerScheme),
  })
  // Migration policy: legacy `name` field is copied to BOTH `shortName`
  // and `longName` to preserve info. New sessions only emit the dual
  // representation. Falsy values (empty string, etc.) fall back to the
  // legacy `name` to keep parity with Desktop.setName which normalizes
  // empty inputs to null.
  .transform((data) => {
    const { name, ...rest } = data;
    return {
      id: rest.id,
      theme: rest.theme,
      tabContainers: rest.tabContainers,
      shortName: rest.shortName || name || null,
      longName: rest.longName || name || null,
    };
  });

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
