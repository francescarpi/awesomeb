import { z } from 'zod';

export const TransitionTypeScheme = z.enum([
  'link',
  'typed',
  'auto_bookmark',
  'auto_subframe',
  'manual_subframe',
  'generated',
  'auto_toplevel',
  'form_submit',
  'reload',
  'keyword',
  'keyword_generated',
]);

export const VisitItemScheme = z
  .object({
    visitId: z.string(),
    url: z.string(),
    title: z.string().optional(),
    visitTime: z.number(),
    referringVisitId: z.string(),
    transition: TransitionTypeScheme,
    isLocal: z.boolean(),
  })
  .strict();

export const HistoryItemScheme = z
  .object({
    id: z.string(),
    url: z.string(),
    title: z.string().optional(),
    lastVisitTime: z.number(),
    visitCount: z.number(),
    visits: z.array(VisitItemScheme),
  })
  .strict();

export const VisitHistoryStoreScheme = z
  .object({
    history: z.array(HistoryItemScheme),
  })
  .strict();

// Export inferred types
export type TransitionType = z.infer<typeof TransitionTypeScheme>;
export type IVisitItem = z.infer<typeof VisitItemScheme>;
export type IHistoryItem = z.infer<typeof HistoryItemScheme>;
export type IVisitHistory = z.infer<typeof VisitHistoryStoreScheme>;
