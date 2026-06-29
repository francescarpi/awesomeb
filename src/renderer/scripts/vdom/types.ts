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
}

// ---------------------------------------------------------------------------
// Patch types — describe how to transform an old tree into a new one
// ---------------------------------------------------------------------------

export type Patch =
  | { type: 'REPLACE'; newNode: VNode | string }
  | { type: 'TEXT'; newText: string }
  | { type: 'PROPS'; added: VNodeProps; removed: string[]; updated: VNodeProps }
  | { type: 'CHILDREN'; patches: (Patch | null)[]; append: (VNode | string)[]; remove: number }
  | { type: 'NONE' }
  | { type: 'COMPOSITE'; patches: Patch[] };
