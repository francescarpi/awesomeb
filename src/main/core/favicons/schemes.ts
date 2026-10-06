import { z } from 'zod';

export const FaviconScheme = z.object({
  tabId: z.number(),
  data: z.string(),
  expires: z.number(),
});

export const FaviconsStoreScheme = z
  .object({
    favicons: z.record(z.string(), z.record(z.string(), FaviconScheme)),
  })
  .strict();

export type IFavicon = z.infer<typeof FaviconScheme>;
export type TFaviconsStore = z.infer<typeof FaviconsStoreScheme>;
export type TFaviconData = string;
