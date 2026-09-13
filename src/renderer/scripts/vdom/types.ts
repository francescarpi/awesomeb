// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VNodeProps = {
  [key: string]:
    string | number | boolean | EventListener | null | undefined | Partial<CSSStyleDeclaration>;
};

export type VNodeChild = VNode | string | number | null | undefined | false;

export interface VNode {
  tag: string;
  props: VNodeProps;
  children: (VNode | string)[];
  key?: string | number;
}

// ---------------------------------------------------------------------------
// Patch types — describe how to transform an old tree into a new one
// ---------------------------------------------------------------------------

/** Single operation on one child position. `index` is old-space (absolute
 * index into the original child list). */
export type ChildrenOp =
  | { op: 'patch'; index: number; patch: Patch }
  | { op: 'insert'; index: number; vnode: VNode | string }
  | { op: 'remove'; index: number };

export type Patch =
  | { type: 'REPLACE'; newNode: VNode | string }
  | { type: 'TEXT'; newText: string }
  | { type: 'PROPS'; added: VNodeProps; removed: string[]; updated: VNodeProps }
  | { type: 'CHILDREN'; ops: ChildrenOp[] }
  | { type: 'NONE' }
  | { type: 'COMPOSITE'; patches: Patch[] };
