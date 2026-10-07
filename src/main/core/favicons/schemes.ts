import { z } from 'zod';

export const FaviconScheme = z.object({
  tabId: z.number(),
  data: z.string(),
  created: z.number(),
});

export const FaviconTabScheme = z.object({
  latest: z.string(),
  favicons: z.record(z.string(), FaviconScheme),
});

export const FaviconsStoreScheme = z
  .object({
    favicons: z.record(z.string(), FaviconTabScheme),
  })
  .strict();

export type IFavicon = z.infer<typeof FaviconScheme>;
export type TFaviconsStore = z.infer<typeof FaviconsStoreScheme>;
export type TFaviconData = string;
