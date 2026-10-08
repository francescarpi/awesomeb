import { z } from 'zod';

export const FaviconScheme = z.object({
  created: z.number(),
  imgData: z.string(),
});

export const FaviconByTabScheme = z.object({
  latest: z.string(),
  favicons: z.array(z.string()),
});

export const FaviconsStoreScheme = z
  .object({
    favicons: z.record(z.string(), FaviconScheme),
    byTab: z.record(z.string(), FaviconByTabScheme),
    byUrl: z.record(z.string(), z.string()),
  })
  .strict();

export type IFavicon = z.infer<typeof FaviconScheme>;
export type IFaviconByTab = z.infer<typeof FaviconByTabScheme>;
export type TFaviconsStore = z.infer<typeof FaviconsStoreScheme>;
export type TFaviconData = string;
