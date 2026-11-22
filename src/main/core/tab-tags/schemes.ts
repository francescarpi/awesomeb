import { z } from 'zod';

export const TabTagsStoreScheme = z
  .object({
    tabTags: z.record(z.string(), z.array(z.string())),
  })
  .strict();

export type ITabTagsStore = z.infer<typeof TabTagsStoreScheme>;
