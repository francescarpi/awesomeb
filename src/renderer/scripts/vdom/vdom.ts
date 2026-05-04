// =============================================================================
// vdom.ts — Minimal Virtual DOM in TypeScript
// =============================================================================

import type { VNodeProps, VNodeChild, VNode, Patch } from './types';

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
  return { tag, props: props ?? {}, children };
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

  const patches: (Patch | null)[] = [];
  let hasChanges = false;

  for (let i = 0; i < oldChildren.length; i++) {
    if (i < newChildren.length) {
      const p = diff(oldChildren[i], newChildren[i]);
      patches.push(p.type === 'NONE' ? null : p);
      if (p.type !== 'NONE') hasChanges = true;
    } else {
      // Extra old children will be removed
      patches.push(null);
    }
  }

  const toAppend = newChildren.slice(oldChildren.length);
  const toRemove = Math.max(0, oldChildren.length - newChildren.length);

  if (!hasChanges && toAppend.length === 0 && toRemove === 0) {
    return { type: 'NONE' };
  }

  return { type: 'CHILDREN', patches, append: toAppend, remove: toRemove };
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
      const childNodes = Array.from(element.childNodes) as (HTMLElement | Text)[];

      // Patch existing children
      for (let i = 0; i < p.patches.length; i++) {
        const childPatch = p.patches[i];
        if (childPatch && childNodes[i]) {
          patch(childNodes[i], childPatch);
        }
      }

      // Remove surplus old children (from the end)
      for (let i = 0; i < p.remove; i++) {
        const last = element.lastChild;
        if (last) element.removeChild(last);
      }

      // Append new children
      for (const newChild of p.append) {
        element.appendChild(render(newChild));
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
    // Remove any previously registered listener of the same type
    const eventType = key.slice(2).toLowerCase();
    const prev = (el as any).__vdom_listeners?.[eventType];
    if (prev) el.removeEventListener(eventType, prev);
    el.addEventListener(eventType, value as EventListener);
    if (!(el as any).__vdom_listeners) (el as any).__vdom_listeners = {};
    (el as any).__vdom_listeners[eventType] = value;
    return;
  }

  if (key === 'style' && typeof value === 'object') {
    Object.assign(el.style, value);
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
  el.removeAttribute(key);
}

export class Renderer {
  private el: HTMLElement | Text | null = null;
  private currentVNode: VNode;

  constructor(
    initialVNode: VNode,
    private readonly containerElementId: string,
  ) {
    this.currentVNode = initialVNode;
  }

  render(): Renderer {
    this.el = render(this.currentVNode);
    const container = document.getElementById(this.containerElementId);
    if (!container) {
      throw new Error(`Container element with ID "${this.containerElementId}" not found`);
    }
    container.appendChild(this.el);
    return this;
  }

  update(newVNode: VNode) {
    if (!this.el) {
      throw new Error('Cannot patch before initial render');
    }

    const domdiff = diff(this.currentVNode, newVNode);
    patch(this.el, domdiff);
    this.currentVNode = newVNode;
  }
}
