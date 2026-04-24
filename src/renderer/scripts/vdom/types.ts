export type TVProps = Record<string, any>;

export type TNodeType = keyof HTMLElementTagNameMap;

export interface IVNode {
  type: TNodeType;
  props: TVProps;
  children: (IVNode | Text)[];
}

export interface IDiffResult {
  kind: 'CREATE' | 'REMOVE' | 'REPLACE' | 'UPDATE';
  newNode?: IVNode;
  propPatches?: Record<string, any>;
  childPatches?: (IDiffResult | null)[];
}
