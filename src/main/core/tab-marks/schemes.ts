import { z } from 'zod';

export const TabMarkScheme = z
  .object({
    trigger: z.string(),
    tabId: z.number(),
    title: z.string(),
  })
  .strict();

export const MarksStoreScheme = z
  .object({
    marks: z.array(TabMarkScheme),
  })
  .strict();

// Export inferred types
export type ITabMark = z.infer<typeof TabMarkScheme>;
export type IMarksStore = z.infer<typeof MarksStoreScheme>;

// Related type (not persisted)
export type TMarksAction =
  | { id: 'deleteAll' }
  | { id: 'deleteOne' }
  | { id: 'add'; trigger: string }
  | { id: 'select'; trigger: string };
