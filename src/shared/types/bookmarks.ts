export enum EBookmarkType {
  Url = 'url',
  Folder = 'folder',
}

export type {
  IBookmark,
  IUrlBookmark,
  IFolderBookmark,
  IPlainBookmark,
} from '@/core/bookmarks/schemes';

export interface IBookmarkEntry {
  title: string;
  url: string;
}
