import type { IBookmark } from '~/types';

export type BookmarksChangePayload =
  | { kind: 'created'; parentId: string; items: IBookmark[] }
  | { kind: 'updated'; tree: IBookmark[]; previousTree: IBookmark[] };
