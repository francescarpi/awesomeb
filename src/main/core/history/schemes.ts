import { z } from 'zod';

export const NavigationEntryScheme = z
  .object({
    pageState: z.string().optional(),
    title: z.string(),
    url: z.string(),
  })
  .strict();

export const SessionHistoryTabScheme = z
  .object({
    index: z.number(),
    entries: z.array(NavigationEntryScheme),
  })
  .strict();

export const SessionHistoryScheme = z
  .object({
    tabs: z.record(z.string(), SessionHistoryTabScheme),
  })
  .strict();

export type ISessionHistory = z.infer<typeof SessionHistoryScheme>;
export type ISessionHistoryTab = z.infer<typeof SessionHistoryTabScheme>;
