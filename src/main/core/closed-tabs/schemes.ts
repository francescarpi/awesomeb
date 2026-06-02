import { z } from 'zod';

export const ClosedTabScheme = z
  .object({
    title: z.string(),
    url: z.string(),
    timestamp: z.number(),
  })
  .strict();

export const ClosedTabsScheme = z
  .object({
    tabs: z.array(ClosedTabScheme),
  })
  .strict();

export type IClosedTab = z.infer<typeof ClosedTabScheme>;
export type IClosedTabs = z.infer<typeof ClosedTabsScheme>;
