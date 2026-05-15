import { EBookmarkType, type IBookmark, type IFolderBookmark, type IUrlBookmark } from '~/types';

export interface IBookmarkEntry {
  bookmark: IBookmark;
  parentId: string | null;
  index: number;
}

export function flattenAll(bookmarks: IBookmark[]): IBookmarkEntry[] {
  const result: IBookmarkEntry[] = [];
  flattenTree(bookmarks, null, result);
  return result;
}

export function findNode(bookmarks: IBookmark[], id: string): IBookmark | null {
  for (const b of bookmarks) {
    if (b.id === id) return b;
    if (b.type === EBookmarkType.Folder) {
      const found = findNode((b as IFolderBookmark).children, id);
      if (found) return found;
    }
  }
  return null;
}

export function insertInFolder(
  bookmarks: IBookmark[],
  folderId: string,
  newBookmark: IBookmark,
  index: number,
): IBookmark[] | null {
  let found = false;
  const result = bookmarks.map((bookmark) => {
    if (bookmark.id === folderId && bookmark.type === EBookmarkType.Folder) {
      found = true;
      const children = [...(bookmark as IFolderBookmark).children];
      if (index >= 0 && index < children.length) {
        children.splice(index, 0, newBookmark);
      } else {
        children.push(newBookmark);
      }
      return {
        ...bookmark,
        children,
        dateGroupModified: Date.now(),
      } as IFolderBookmark;
    }
    if (bookmark.type === EBookmarkType.Folder) {
      const updatedChildren = insertInFolder(
        (bookmark as IFolderBookmark).children,
        folderId,
        newBookmark,
        index,
      );
      if (updatedChildren) {
        found = true;
        return {
          ...bookmark,
          children: updatedChildren,
        } as IFolderBookmark;
      }
    }
    return bookmark;
  });
  return found ? result : null;
}

export function removeFromTree(bookmarks: IBookmark[], id: string): IBookmark[] | null {
  let found = false;
  const result = bookmarks
    .filter((bookmark) => {
      if (bookmark.id === id) {
        found = true;
        return false;
      }
      return true;
    })
    .map((bookmark) => {
      if (bookmark.type === EBookmarkType.Folder) {
        const updatedChildren = removeFromTree((bookmark as IFolderBookmark).children, id);
        if (updatedChildren) {
          found = true;
          return {
            ...bookmark,
            children: updatedChildren,
            dateGroupModified: Date.now(),
          } as IFolderBookmark;
        }
      }
      return bookmark;
    });
  return found ? result : null;
}

export function extractFromTree(
  bookmarks: IBookmark[],
  id: string,
): { tree: IBookmark[]; node: IBookmark } | null {
  let extracted: IBookmark | null = null;
  const result = bookmarks
    .filter((b) => {
      if (b.id === id) {
        extracted = b;
        return false;
      }
      return true;
    })
    .map((b) => {
      if (b.type === EBookmarkType.Folder) {
        const sub = extractFromTree((b as IFolderBookmark).children, id);
        if (sub) {
          extracted = sub.node;
          return {
            ...b,
            children: sub.tree,
            dateGroupModified: Date.now(),
          } as IFolderBookmark;
        }
      }
      return b;
    });
  return extracted ? { tree: result, node: extracted } : null;
}

export function applyUpdate(
  bookmarks: IBookmark[],
  id: string,
  changes: { title?: string; url?: string },
  onUpdate: (node: IBookmark) => void,
): IBookmark[] {
  return bookmarks.map((b) => {
    if (b.id === id) {
      if (b.type === EBookmarkType.Url) {
        const updated = { ...b, ...changes } as IUrlBookmark;
        onUpdate(updated);
        return updated;
      }
      const updated = { ...b, title: changes.title ?? b.title } as IFolderBookmark;
      onUpdate(updated);
      return updated;
    }
    if (b.type === EBookmarkType.Folder) {
      return {
        ...b,
        children: applyUpdate((b as IFolderBookmark).children, id, changes, onUpdate),
      } as IFolderBookmark;
    }
    return b;
  });
}

export function touchFolder(bookmarks: IBookmark[], folderId: string): IBookmark[] {
  return bookmarks.map((b) => {
    if (b.id === folderId && b.type === EBookmarkType.Folder) {
      return { ...b, dateGroupModified: Date.now() } as IFolderBookmark;
    }
    if (b.type === EBookmarkType.Folder) {
      return {
        ...b,
        children: touchFolder((b as IFolderBookmark).children, folderId),
      } as IFolderBookmark;
    }
    return b;
  });
}

function flattenTree(
  bookmarks: IBookmark[],
  parentId: string | null,
  result: IBookmarkEntry[],
): void {
  bookmarks.forEach((bookmark, index) => {
    result.push({ bookmark, parentId, index });
    if (bookmark.type === EBookmarkType.Folder) {
      flattenTree((bookmark as IFolderBookmark).children, bookmark.id, result);
    }
  });
}
