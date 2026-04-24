import type { TVProps, TNodeType, IVNode, IDiffResult } from './types';

export function h(type: TNodeType, props: TVProps, ...children: (IVNode | string)[]): IVNode {
  return {
    type,
    props: props || {},
    children: children
      .flat()
      .map((child) =>
        typeof child === 'string' || typeof child === 'number'
          ? document.createTextNode(String(child))
          : child,
      ),
  };
}

export function render(vnode: IVNode | Text): HTMLElement | Text {
  if (vnode instanceof Text) {
    return vnode;
  }

  const el = document.createElement(vnode.type);

  for (const [key, value] of Object.entries(vnode.props)) {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }

  for (const child of vnode.children) {
    el.appendChild(render(child));
  }

  return el;
}

export function diff(oldNode: IVNode | null, newNode: IVNode): IDiffResult | null {
  if (!oldNode) {
    return { kind: 'CREATE', newNode };
  }

  if (!newNode) {
    return { kind: 'REMOVE' };
  }

  if (oldNode.type !== newNode.type) {
    return { kind: 'REPLACE', newNode };
  }

  if (oldNode instanceof Text && newNode instanceof Text) {
    if (oldNode.textContent !== newNode.textContent) {
      return { kind: 'REPLACE', newNode };
    }
    return null;
  }

  const propPatches = {};
  const allKeys = new Set([...Object.keys(oldNode.props), ...Object.keys(newNode.props)]);

  for (const key of allKeys) {
    if (key.startsWith('on')) {
      continue;
    }
    if (oldNode.props[key] !== newNode.props[key]) {
      propPatches[key] = newNode.props[key];
    }
  }

  const childrenLen = Math.max(oldNode.children.length, newNode.children.length);

  const childPatches = Array.from({ length: childrenLen }, (_, i) =>
    diff(oldNode.children[i] as IVNode, newNode.children[i] as IVNode),
  );

  if (Object.keys(propPatches).length === 0 && childPatches.every((p) => p === null)) {
    return null;
  }

  return { kind: 'UPDATE', propPatches, childPatches };
}

function patch(domNode: HTMLElement, patchDescriptor: IDiffResult | null) {
  if (!patchDescriptor) return;

  const parent = domNode.parentNode;
  if (!parent) return;

  if (patchDescriptor.kind === 'REMOVE') {
    parent.removeChild(domNode);
    return;
  }

  if (patchDescriptor.kind === 'CREATE') {
    parent.appendChild(render(patchDescriptor.newVnode));
    return;
  }

  if (patchDescriptor.kind === 'REPLACE') {
    parent.replaceChild(render(patchDescriptor.newVnode), domNode);
    return;
  }

  if (patchDescriptor.kind instanceof Text) {
    domNode.nodeValue = patchDescriptor;
    return;
  }

  if (patchDescriptor.kind === 'UPDATE') {
    for (const [key, value] of Object.entries(patchDescriptor.propPatches)) {
      if (key.startsWith('on') && typeof value === 'function') {
        // Event handler updates are out of scope — skip for now
      } else if (value === undefined) {
        domNode.removeAttribute(key);
      } else {
        domNode.setAttribute(key, value);
      }
    }

    const children = Array.from(domNode.childNodes);
    patchDescriptor.childPatches.forEach((childPatch, i) => {
      if (childPatch && childPatch.kind === 'CREATE') {
        domNode.appendChild(render(childPatch.newVnode));
      } else {
        patch(children[i], childPatch);
      }
    });
  }
}
