// =============================================================================
// vdom.ts — Minimal Virtual DOM in TypeScript
// =============================================================================

import type { VNodeProps, VNodeChild, VNode, Patch, ChildrenOp } from './types';

// Side-channel property names tracked on real DOM elements. The element is
// the only place that outlives a VNode, so we stash state needed for diff
// against the previous render there.
const VDOM_STYLE_KEY = '__vdom_prev_style';

// ---------------------------------------------------------------------------
// h — Hyperscript factory
// ---------------------------------------------------------------------------

/**
 * Creates a Virtual DOM node.
 *
 * @example
 * h('div', { class: 'container' },
 *   h('p', { class: 'text' }, 'Hello world'),
 *   'Just a string child',
 * )
 */
export function h(tag: string, props: VNodeProps | null, ...rawChildren: VNodeChild[]): VNode {
  const children = flattenChildren(rawChildren);
  // `key` is a diff hint, not a real prop — strip it so it never reaches setProp.
  const { key, ...rest } = props ?? {};
  return { tag, props: rest, children, key: key as string | number | undefined };
}

function flattenChildren(raw: VNodeChild[]): (VNode | string)[] {
  const result: (VNode | string)[] = [];
  for (const child of raw) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) {
      result.push(...flattenChildren(child));
    } else if (typeof child === 'number') {
      result.push(String(child));
    } else {
      result.push(child as VNode | string);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// render — VNode → real DOM
// ---------------------------------------------------------------------------

/**
 * Converts a VNode (or plain string) into a real HTMLElement / Text node.
 *
 * @example
 * const vdom = h('div', { class: 'app' }, 'Hello')
 * document.getElementById('root')!.appendChild(render(vdom))
 */
export function render(node: VNode | string): HTMLElement | Text {
  if (typeof node === 'string') {
    return document.createTextNode(node);
  }

  const el = document.createElement(node.tag);
  applyProps(el, node.props, {});

  for (const child of node.children) {
    el.appendChild(render(child));
  }

  return el;
}

// ---------------------------------------------------------------------------
// diff — compare two VNode trees and produce a Patch
// ---------------------------------------------------------------------------

/**
 * Computes the difference between two virtual nodes.
 * Returns a Patch that, when applied via `patch()`, transforms
 * the real DOM from the oldNode shape to the newNode shape.
 */
export function diff(oldNode: VNode | string, newNode: VNode | string): Patch {
  // Both are text nodes
  if (typeof oldNode === 'string' && typeof newNode === 'string') {
    return oldNode === newNode ? { type: 'NONE' } : { type: 'TEXT', newText: newNode };
  }

  // Type changed (text ↔ element) or tag changed → full replace
  if (
    typeof oldNode !== typeof newNode ||
    (typeof oldNode === 'object' && typeof newNode === 'object' && oldNode.tag !== newNode.tag)
  ) {
    return { type: 'REPLACE', newNode };
  }

  // Both are VNodes with the same tag — diff props + children
  const oldVNode = oldNode as VNode;
  const newVNode = newNode as VNode;

  const collected: Patch[] = [];

  const propsPatch = diffProps(oldVNode.props, newVNode.props);
  if (propsPatch.type !== 'NONE') collected.push(propsPatch);

  const childrenPatch = diffChildren(oldVNode.children, newVNode.children);
  if (childrenPatch.type !== 'NONE') collected.push(childrenPatch);

  if (collected.length === 0) return { type: 'NONE' };
  if (collected.length === 1) return collected[0];
  return { type: 'COMPOSITE', patches: collected };
}

function diffProps(oldProps: VNodeProps, newProps: VNodeProps): Patch {
  const added: VNodeProps = {};
  const updated: VNodeProps = {};
  const removed: string[] = [];

  for (const key in newProps) {
    if (!(key in oldProps)) {
      added[key] = newProps[key];
    } else if (oldProps[key] !== newProps[key]) {
      updated[key] = newProps[key];
    }
  }

  for (const key in oldProps) {
    if (!(key in newProps)) removed.push(key);
  }

  if (
    Object.keys(added).length === 0 &&
    Object.keys(updated).length === 0 &&
    removed.length === 0
  ) {
    return { type: 'NONE' };
  }

  return { type: 'PROPS', added, removed, updated };
}

function diffChildren(oldChildren: (VNode | string)[], newChildren: (VNode | string)[]): Patch {
  const maxLen = Math.max(oldChildren.length, newChildren.length);
  if (maxLen === 0) return { type: 'NONE' };

  // Keyed path (opt-in): any key present anywhere, no duplicate keys, and the
  // pre-scan says matched old indices stay strictly increasing. Otherwise the
  // proven index-based (positional) path is used — byte-identical behavior.
  if (oldChildren.some(isKeyed) || newChildren.some(isKeyed)) {
    if (
      !hasDuplicateKeys(oldChildren) &&
      !hasDuplicateKeys(newChildren) &&
      preScanStrictlyIncreasing(oldChildren, newChildren)
    ) {
      const keyed = diffChildrenKeyed(oldChildren, newChildren);
      if (keyed !== null) return keyed;
    }
    // Fall through to the unkeyed path on fallback conditions.
  }

  return diffChildrenUnkeyed(oldChildren, newChildren);
}

/** Positional index-based diff — the pre-keyed behavior, kept byte-identical. */
function diffChildrenUnkeyed(
  oldChildren: (VNode | string)[],
  newChildren: (VNode | string)[],
): Patch {
  const ops: ChildrenOp[] = [];
  const min = Math.min(oldChildren.length, newChildren.length);

  for (let i = 0; i < min; i++) {
    const p = diff(oldChildren[i], newChildren[i]);
    if (p.type !== 'NONE') ops.push({ op: 'patch', index: i, patch: p });
  }

  // Surplus old children → remove ops (applied end→start by the patcher).
  for (let i = newChildren.length; i < oldChildren.length; i++) {
    ops.push({ op: 'remove', index: i });
  }

  // Surplus new children → insert ops at their absolute index.
  for (let i = oldChildren.length; i < newChildren.length; i++) {
    ops.push({ op: 'insert', index: i, vnode: newChildren[i] });
  }

  if (ops.length === 0) return { type: 'NONE' };
  return { type: 'CHILDREN', ops };
}

/**
 * Keyed diff — children carrying a `key` match by key and stay in place;
 * unkeyed children compare positionally at the current cursor. Returns
 * `null` when a guard condition forces the unkeyed positional fallback.
 */
function diffChildrenKeyed(
  oldChildren: (VNode | string)[],
  newChildren: (VNode | string)[],
): Patch | null {
  const oldKeyMap = new Map<string | number, number>();
  oldChildren.forEach((child, i) => {
    if (isKeyed(child)) oldKeyMap.set(child.key, i);
  });

  const usedOld: boolean[] = new Array(oldChildren.length).fill(false);
  const ops: ChildrenOp[] = [];
  let cursor = 0;

  for (const child of newChildren) {
    if (isKeyed(child)) {
      const j = oldKeyMap.get(child.key);
      if (j !== undefined && !usedOld[j]) {
        // Keyed match → patch in place at its old index (tag mismatch → REPLACE
        // comes out of diff() naturally, keeping the position).
        while (cursor < j) {
          if (!usedOld[cursor]) ops.push({ op: 'remove', index: cursor });
          cursor++;
        }
        cursor = j + 1;
        usedOld[j] = true;
        const p = diff(oldChildren[j], child);
        if (p.type !== 'NONE') ops.push({ op: 'patch', index: j, patch: p });
      } else {
        // Key absent → insert at the cursor. The cursor deliberately does NOT
        // advance: consecutive unmatched-keyed inserts share the same slot and
        // the patcher's ascending stable phase-2 applies them in emitted order,
        // each anchored before the first surviving original node at j >= index
        // (model-array patcher is order-independent by construction).
        ops.push({ op: 'insert', index: cursor, vnode: child });
      }
    } else {
      // Unkeyed → positional comparison at the cursor.
      if (cursor < oldChildren.length) {
        // Guard: an unkeyed child consuming a keyed slot that a later keyed
        // child still expects → fall back to pure positional diff.
        if (isKeyed(oldChildren[cursor]) && !usedOld[cursor]) {
          return null;
        }
        const p = diff(oldChildren[cursor], child);
        if (p.type !== 'NONE') ops.push({ op: 'patch', index: cursor, patch: p });
        usedOld[cursor] = true;
        cursor++;
      } else {
        ops.push({ op: 'insert', index: cursor, vnode: child });
      }
    }
  }

  // Leftover unconsumed old children → remove ops.
  for (let i = cursor; i < oldChildren.length; i++) {
    if (!usedOld[i]) ops.push({ op: 'remove', index: i });
  }

  if (ops.length === 0) return { type: 'NONE' };
  return { type: 'CHILDREN', ops };
}

function isKeyed(child: VNode | string): child is VNode & { key: string | number } {
  return typeof child !== 'string' && child.key !== undefined;
}

function hasDuplicateKeys(children: (VNode | string)[]): boolean {
  const seen = new Set<string | number>();
  for (const child of children) {
    if (!isKeyed(child)) continue;
    if (seen.has(child.key)) return true;
    seen.add(child.key);
  }
  return false;
}

/** Reorder detection: matched old indices for keyed new children must be
 * strictly increasing, else the list was reordered and we fall back to the
 * positional (content-per-position) path — zero DOM moves. */
function preScanStrictlyIncreasing(
  oldChildren: (VNode | string)[],
  newChildren: (VNode | string)[],
): boolean {
  const oldKeyMap = new Map<string | number, number>();
  oldChildren.forEach((child, i) => {
    if (isKeyed(child)) oldKeyMap.set(child.key, i);
  });

  let last = -1;
  for (const child of newChildren) {
    if (!isKeyed(child)) continue;
    const j = oldKeyMap.get(child.key);
    if (j === undefined) continue; // not matched — treated as insert, does not affect order
    if (j <= last) return false;
    last = j;
  }
  return true;
}

// ---------------------------------------------------------------------------
// patch — apply a Patch to a real DOM node
// ---------------------------------------------------------------------------

/**
 * Applies a Patch (produced by `diff`) to an existing real DOM node,
 * mutating the DOM in place.
 *
 * Returns the (potentially replaced) DOM node.
 *
 * @example
 * let el = render(oldVNode)
 * container.appendChild(el)
 *
 * const changes = diff(oldVNode, newVNode)
 * el = patch(el, changes)
 */
export function patch(el: HTMLElement | Text, p: Patch): HTMLElement | Text {
  switch (p.type) {
    case 'NONE':
      return el;

    case 'REPLACE': {
      const newEl = render(p.newNode);
      el.parentNode?.replaceChild(newEl, el);
      return newEl;
    }

    case 'TEXT': {
      el.textContent = p.newText;
      return el;
    }

    case 'PROPS': {
      const element = el as HTMLElement;
      applyProps(element, { ...p.added, ...p.updated }, {});
      for (const key of p.removed) {
        removeProp(element, key);
      }
      return el;
    }

    case 'CHILDREN': {
      const element = el as HTMLElement;
      // Model array = fixed-length snapshot of the ORIGINAL child list. All
      // ops use old-space indices against it, so live-DOM drift is impossible.
      const model = Array.from(element.childNodes) as (HTMLElement | Text | null)[];

      // Phase 1 — remove ops end→start (removing from the live childNodes
      // shifts later indices, so we must go from the highest index down).
      const removes = p.ops
        .filter((op): op is Extract<ChildrenOp, { op: 'remove' }> => op.op === 'remove')
        .sort((a, b) => b.index - a.index);
      for (const op of removes) {
        const node = model[op.index];
        if (node) element.removeChild(node);
        model[op.index] = null;
      }

      // Phase 2 — patch + insert ops ascending (order-independent: anchors
      // reference surviving original-space nodes).
      const phase2 = p.ops.filter((op) => op.op !== 'remove').sort((a, b) => a.index - b.index);
      for (const op of phase2) {
        if (op.op === 'patch') {
          const node = model[op.index];
          if (node) {
            // REPLACE returns the new node — write it back so later inserts
            // anchor to the *replaced* node, not the stale original.
            model[op.index] = patch(node, op.patch) as HTMLElement | Text;
          } else if (process.env.NODE_ENV !== 'production') {
            // A patch op whose index was already nulled by a prior remove.
            // diff() never emits this combination in normal use; warn loudly
            // in dev so a future refactor that does is caught immediately.
            console.warn(
              '[vdom] patch op at index',
              op.index,
              'was orphaned by a prior remove in the same patch',
            );
          }
        } else {
          // Insert: anchor = first surviving model entry at j >= index.
          const anchor = firstSurviving(model, op.index);
          element.insertBefore(render(op.vnode), anchor ?? null);
        }
      }

      return el;
    }

    case 'COMPOSITE': {
      let current = el;
      for (const subPatch of p.patches) {
        current = patch(current, subPatch);
      }
      return current;
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function applyProps(el: HTMLElement, props: VNodeProps, _oldProps: VNodeProps): void {
  for (const key in props) {
    const value = props[key];
    setProp(el, key, value);
  }
}

function setProp(el: HTMLElement, key: string, value: VNodeProps[string]): void {
  if (value === null || value === undefined || value === false) {
    removeProp(el, key);
    return;
  }

  if (key.startsWith('on') && typeof value === 'function') {
    // Identity guard: same handler ref re-rendered → skip remove/add churn.
    const eventType = key.slice(2).toLowerCase();
    const prev = (el as any).__vdom_listeners?.[eventType];
    if (prev === value) return;
    // Remove any previously registered listener of the same type
    if (prev) el.removeEventListener(eventType, prev);
    el.addEventListener(eventType, value as EventListener);
    if (!(el as any).__vdom_listeners) (el as any).__vdom_listeners = {};
    (el as any).__vdom_listeners[eventType] = value;
    return;
  }

  if (key === 'style' && typeof value === 'object' && value !== null) {
    // Diff against the previous style object tracked on the element. Without
    // this, properties removed in the new VNode linger on the DOM (Object.assign
    // only adds/updates) — made worse by row memoization, where one rendered
    // style could outlive the VNode that produced it.
    const prev = (el as any)[VDOM_STYLE_KEY] as Record<string, unknown> | undefined;
    const next = value as Record<string, unknown>;
    if (prev) {
      for (const k of Object.keys(prev)) {
        if (!(k in next)) {
          (el.style as unknown as Record<string, string>)[k] = '';
        }
      }
    }
    Object.assign(el.style, next);
    (el as any)[VDOM_STYLE_KEY] = next;
    return;
  }

  if (typeof value === 'boolean') {
    if (value) el.setAttribute(key, '');
    else el.removeAttribute(key);
    return;
  }

  if (key === 'innerHTML' && typeof value === 'string') {
    el.innerHTML = value;
    return;
  }

  el.setAttribute(key, String(value));
}

function removeProp(el: HTMLElement, key: string): void {
  if (key.startsWith('on')) {
    const eventType = key.slice(2).toLowerCase();
    const prev = (el as any).__vdom_listeners?.[eventType];
    if (prev) {
      el.removeEventListener(eventType, prev);
      delete (el as any).__vdom_listeners[eventType];
    }
    return;
  }
  if (key === 'style') {
    el.removeAttribute('style');
    delete (el as any)[VDOM_STYLE_KEY];
    return;
  }
  el.removeAttribute(key);
}

/** First surviving (non-null) entry in the model at j >= from, used as the
 * `insertBefore` anchor for insert ops. */
function firstSurviving(
  model: (HTMLElement | Text | null)[],
  from: number,
): HTMLElement | Text | null {
  for (let i = from; i < model.length; i++) {
    if (model[i] !== null) return model[i];
  }
  return null;
}

export class Renderer {
  private el: HTMLElement | Text | null = null;
  private currentVNode: VNode;

  constructor(initialVNode: VNode) {
    this.currentVNode = initialVNode;
  }

  render(
    containerElementId: string,
    opts?: { onRendered?: () => void; replace?: boolean },
  ): Renderer {
    this.el = render(this.currentVNode);
    const container = document.getElementById(containerElementId);
    if (!container) {
      throw new Error(`Container element with ID "${containerElementId}" not found`);
    }

    if (opts?.replace) {
      container.innerHTML = '';
    }

    container.appendChild(this.el);

    if (opts?.onRendered) {
      opts.onRendered();
    }

    return this;
  }

  update(newVNode: VNode, opts?: { onUpdated?: () => void }) {
    if (!this.el) {
      throw new Error('Cannot patch before initial render');
    }

    const domdiff = diff(this.currentVNode, newVNode);
    this.el = patch(this.el, domdiff);
    this.currentVNode = newVNode;

    if (opts?.onUpdated) {
      opts.onUpdated();
    }
  }
}
