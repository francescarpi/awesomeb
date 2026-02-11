export enum EBookmarkType {
  Url = 'url',
  Folder = 'folder',
}

export interface IUrlBookmark {
  id: string;
  type: EBookmarkType.Url;
  url: string;
  title: string;
}

export interface IFolderBookmark {
  id: string;
  type: EBookmarkType.Folder;
  title: string;
  children: IBookmark[];
}

export type IBookmark = IUrlBookmark | IFolderBookmark;

export interface IPlainBookmark {
  name: string;
  url: string;
  path: string[];
  folderId: string;
}
