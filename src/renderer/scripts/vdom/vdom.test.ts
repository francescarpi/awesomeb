import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { h, render, diff, patch, Renderer } from './vdom';
import { btnIcon } from './btn-icon';
import {
  desktopIdFromEvent,
  selectDesktopFromEvent,
  desktopMenuFromEvent,
} from './desktop-handlers';
import type { VNode, VNodeProps, Patch } from './types';

const asElem = (n: VNode | string): HTMLElement | Text => render(n);
const asEl = (n: VNode | string): HTMLElement => render(n) as HTMLElement;
const vn = (s: string, p: VNodeProps = {}, ...c: (VNode | string)[]): VNode => h(s, p, ...c);

describe('h() — VNode creation', () => {
  test('creates basic VNode with tag, props, and children', () => {
    const node = h('div', { class: 'container' }, 'Hello');
    expect(node.tag).toBe('div');
    expect(node.props.class).toBe('container');
    expect(node.children).toEqual(['Hello']);
  });

  test('flattens nested arrays in children', () => {
    const node = h('div', null, [h('span', null, 'a'), [h('span', null, 'b')]] as any);
    expect(node.children).toHaveLength(2);
    expect((node.children[0] as VNode).tag).toBe('span');
    expect((node.children[1] as VNode).tag).toBe('span');
  });

  test('filters out null, undefined, false from children', () => {
    const node = h('div', null, 'a', null, undefined, false, 'b');
    expect(node.children).toEqual(['a', 'b']);
  });

  test('converts numbers to strings in children', () => {
    const node = h('div', null, 42, 3.14);
    expect(node.children).toEqual(['42', '3.14']);
  });

  test('handles nested children with multiple levels', () => {
    const node = vn(
      'div',
      {},
      vn(
        'ul',
        {},
        vn('li', {}, 'item1'),
        vn('li', {}, 'item2'),
        vn('li', {}, vn('span', {}, 'nested')),
      ),
      vn('p', {}, 'text'),
    );
    expect(node.tag).toBe('div');
    const first = node.children[0] as VNode;
    expect(first.tag).toBe('ul');
    expect(first.children).toHaveLength(3);
    const third = first.children[2] as VNode;
    expect((third.children[0] as VNode).tag).toBe('span');
  });

  test('handles null props', () => {
    const node = h('div', null, 'text');
    expect(node.props).toEqual({});
  });
});

describe('render() — VNode to DOM', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  test('renders string as Text node', () => {
    const text = asElem('Hello world');
    expect(text.textContent).toBe('Hello world');
  });

  test('renders basic element with tag and props', () => {
    const node = h('div', { id: 'test', class: 'box' }, 'content');
    const el = asEl(node);
    expect(el.tagName).toBe('DIV');
    expect(el.id).toBe('test');
    expect(el.className).toBe('box');
    expect(el.textContent).toBe('content');
  });

  test('renders nested children at multiple levels', () => {
    const node = vn(
      'div',
      { class: 'level-1' },
      vn(
        'section',
        { class: 'level-2' },
        vn('ul', { class: 'level-3' }, vn('li', {}, 'item1'), vn('li', {}, 'item2')),
      ),
    );
    const el = asEl(node);
    container.appendChild(el);

    const li = el.querySelector('li');
    expect(li?.textContent).toBe('item1');
  });

  test('renders data-* attributes', () => {
    const node = h('div', { 'data-id': '123', 'data-value': 'test' }, 'x');
    const el = asEl(node);
    expect(el.getAttribute('data-id')).toBe('123');
    expect(el.getAttribute('data-value')).toBe('test');
  });

  test('renders boolean attribute as empty string when true', () => {
    const node = h('input', { disabled: true, readonly: false });
    const el = render(node) as HTMLInputElement;
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.hasAttribute('readonly')).toBe(false);
  });

  test('renders style object', () => {
    const node = h('div', { style: { color: 'red', fontSize: '14px' } }, 'x');
    const el = asEl(node);
    expect(el.style.color).toBe('red');
    expect(el.style.fontSize).toBe('14px');
  });

  test('renders event listener', () => {
    const handler = vi.fn();
    const node = h('button', { onClick: handler }, 'click me');
    const el = render(node) as HTMLButtonElement;
    container.appendChild(el);

    el.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('renders innerHTML', () => {
    const node = h('div', { innerHTML: '<span>inner</span>' }, '');
    const el = asEl(node);
    expect(el.querySelector('span')?.textContent).toBe('inner');
  });

  test('handles multiple sibling children', () => {
    const node = h('div', null, 'a', 'b', 'c');
    const el = asEl(node);
    expect(el.childNodes).toHaveLength(3);
  });
});

describe('diff() — VNode comparison', () => {
  test('returns NONE for identical text nodes', () => {
    const p = diff('hello', 'hello');
    expect(p.type).toBe('NONE');
  });

  test('returns TEXT when text content changes', () => {
    const p = diff('hello', 'world');
    expect(p.type).toBe('TEXT');
    expect((p as any).newText).toBe('world');
  });

  test('returns REPLACE when tag changes', () => {
    const oldNode = h('div', null, 'x');
    const newNode = h('span', null, 'x');
    const p = diff(oldNode, newNode);
    expect(p.type).toBe('REPLACE');
  });

  test('returns REPLACE when type changes (text to element)', () => {
    const p = diff('text', h('div', null, 'x'));
    expect(p.type).toBe('REPLACE');
  });

  test('returns REPLACE when type changes (element to text)', () => {
    const p = diff(h('div', null, 'x'), 'text');
    expect(p.type).toBe('REPLACE');
  });

  test('returns PROPS with added props', () => {
    const oldNode = h('div', null, 'x');
    const newNode = h('div', { class: 'new' }, 'x');
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('PROPS');
    expect(p.added.class).toBe('new');
  });

  test('returns PROPS with updated props', () => {
    const oldNode = h('div', { class: 'old' }, 'x');
    const newNode = h('div', { class: 'new' }, 'x');
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('PROPS');
    expect(p.updated.class).toBe('new');
  });

  test('returns PROPS with removed props', () => {
    const oldNode = h('div', { class: 'old', id: 'x' }, 'x');
    const newNode = h('div', { id: 'x' }, 'x');
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('PROPS');
    expect(p.removed).toContain('class');
  });

  test('returns combined PROPS with added, updated, and removed', () => {
    const oldNode = h('div', { class: 'old', id: 'a' }, 'x');
    const newNode = h('div', { class: 'new', data: 'b' }, 'x');
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('PROPS');
    expect(p.added.data).toBe('b');
    expect(p.updated.class).toBe('new');
    expect(p.removed).toContain('id');
  });

  test('returns NONE for identical props', () => {
    const oldNode = h('div', { class: 'box', id: 'x' }, 'x');
    const newNode = h('div', { class: 'box', id: 'x' }, 'x');
    const p = diff(oldNode, newNode);
    expect(p.type).toBe('NONE');
  });

  test('returns CHILDREN with insert ops for appended children', () => {
    const oldNode = h('div', null, 'a');
    const newNode = h('div', null, 'a', 'b', 'c');
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('CHILDREN');
    const inserts = p.ops.filter((op: any) => op.op === 'insert');
    expect(inserts).toHaveLength(2);
  });

  test('returns CHILDREN with remove ops for removed children', () => {
    const oldNode = h('div', null, 'a', 'b', 'c');
    const newNode = h('div', null, 'a');
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('CHILDREN');
    const removes = p.ops.filter((op: any) => op.op === 'remove');
    expect(removes).toHaveLength(2);
  });

  test('returns CHILDREN with patch op for nested children', () => {
    const oldNode = h('div', null, h('span', { class: 'item' }, 'old'));
    const newNode = h('div', null, h('span', { class: 'item' }, 'new'));
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('CHILDREN');
    const patches = p.ops.filter((op: any) => op.op === 'patch');
    expect(patches).toHaveLength(1);
    expect(patches[0].patch.type).toBe('CHILDREN');
  });

  test('returns COMPOSITE for mixed changes (props + children)', () => {
    const oldNode = h('div', { class: 'a' }, 'x');
    const newNode = h('div', { class: 'b' }, 'y');
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('COMPOSITE');
    expect(p.patches).toHaveLength(2);
  });

  test('handles deep nested VNode trees (level 3+)', () => {
    const oldNode = vn(
      'div',
      {},
      vn('section', {}, vn('ul', {}, vn('li', { class: 'item' }, 'a'), vn('li', {}, 'b'))),
    );
    const newNode = vn(
      'div',
      {},
      vn('section', {}, vn('ul', {}, vn('li', { class: 'item changed' }, 'a'), vn('li', {}, 'b'))),
    );
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('CHILDREN');
  });
});

describe('patch() — apply Patch to DOM', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  test('NONE returns same element unchanged', () => {
    const node = h('div', null, 'x');
    const el = asEl(node);
    container.appendChild(el);

    const result = patch(el, { type: 'NONE' });
    expect(result).toBe(el);
    expect(el.textContent).toBe('x');
  });

  test('REPLACE replaces element entirely', () => {
    const oldNode = h('div', null, 'old');
    const el = asEl(oldNode);
    container.appendChild(el);

    const newNode = h('span', { class: 'new' }, 'new');
    patch(el, { type: 'REPLACE', newNode });
    expect(container.querySelector('span')).not.toBeNull();
    expect(container.textContent).toBe('new');
  });

  test('TEXT updates textContent', () => {
    const node = h('div', null, 'old');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, { type: 'TEXT', newText: 'new' });
    expect(el.textContent).toBe('new');
  });

  test('PROPS adds new attributes', () => {
    const node = h('div', null, 'x');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, { type: 'PROPS', added: { id: 'test' }, updated: {}, removed: [] });
    expect(el.getAttribute('id')).toBe('test');
  });

  test('PROPS updates existing attributes', () => {
    const node = h('div', { class: 'old' }, 'x');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, { type: 'PROPS', added: {}, updated: { class: 'new' }, removed: [] });
    expect(el.className).toBe('new');
  });

  test('PROPS removes attributes', () => {
    const node = h('div', { id: 'test', class: 'box' }, 'x');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, { type: 'PROPS', added: {}, updated: {}, removed: ['class'] });
    expect(el.hasAttribute('class')).toBe(false);
  });

  test('PROPS handles event listeners', () => {
    const node = h('button', null, 'click');
    const el = render(node) as HTMLButtonElement;
    container.appendChild(el);

    const handler = vi.fn();
    patch(el, { type: 'PROPS', added: { onClick: handler }, updated: {}, removed: [] });
    el.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('CHILDREN patches existing child text', () => {
    const node = h('div', null, 'old');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, {
      type: 'CHILDREN',
      ops: [{ op: 'patch', index: 0, patch: { type: 'TEXT', newText: 'new' } }],
    });
    expect(el.textContent).toBe('new');
  });

  test('CHILDREN removes surplus old children', () => {
    const node = h('div', null, 'a', 'b', 'c');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, {
      type: 'CHILDREN',
      ops: [
        { op: 'remove', index: 2 },
        { op: 'remove', index: 1 },
      ],
    });
    expect(el.textContent).toBe('a');
  });

  test('CHILDREN appends new children', () => {
    const node = h('div', null, 'a');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, {
      type: 'CHILDREN',
      ops: [
        { op: 'insert', index: 1, vnode: 'b' },
        { op: 'insert', index: 2, vnode: 'c' },
      ],
    });
    expect(el.textContent).toBe('abc');
  });

  test('CHILDREN handles deep nested structure', () => {
    const node = vn('div', {}, vn('ul', {}, vn('li', {}, 'item1')));
    const el = asEl(node);
    container.appendChild(el);

    patch(el, {
      type: 'CHILDREN',
      ops: [
        {
          op: 'patch',
          index: 0,
          patch: {
            type: 'CHILDREN',
            ops: [
              {
                op: 'patch',
                index: 0,
                patch: {
                  type: 'CHILDREN',
                  ops: [{ op: 'patch', index: 0, patch: { type: 'TEXT', newText: 'updated' } }],
                },
              },
            ],
          },
        },
      ],
    });

    const li = el.querySelector('li');
    expect(li?.textContent).toBe('updated');
  });

  test('COMPOSITE applies multiple patches in sequence', () => {
    const node = h('div', { class: 'a' }, 'text');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, {
      type: 'COMPOSITE',
      patches: [
        { type: 'PROPS', added: { id: 'test' }, updated: {}, removed: [] },
        {
          type: 'CHILDREN',
          ops: [{ op: 'patch', index: 0, patch: { type: 'TEXT', newText: 'new' } }],
        },
      ],
    });

    expect(el.getAttribute('id')).toBe('test');
    expect(el.textContent).toBe('new');
  });
});

describe('diff() + patch() integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  test('text update cycle', () => {
    const oldNode = h('div', null, 'old');
    const el = asEl(oldNode);
    container.appendChild(el);

    const newNode = h('div', null, 'new');
    const d = diff(oldNode, newNode);
    patch(el, d);

    expect(container.textContent).toBe('new');
  });

  test('props update cycle', () => {
    const oldNode = h('div', { class: 'old' }, 'x');
    const el = asEl(oldNode);
    container.appendChild(el);

    const newNode = h('div', { class: 'new', id: 'test' }, 'x');
    const d = diff(oldNode, newNode);
    patch(el, d);

    expect(el.className).toBe('new');
    expect(el.id).toBe('test');
  });

  test('add children cycle', () => {
    const oldNode = h('div', null, 'a');
    const el = asEl(oldNode);
    container.appendChild(el);

    const newNode = h('div', null, 'a', 'b', 'c');
    const d = diff(oldNode, newNode);
    patch(el, d);

    expect(el.textContent).toBe('abc');
  });

  test('remove children cycle', () => {
    const oldNode = h('div', null, 'a', 'b', 'c');
    const el = asEl(oldNode);
    container.appendChild(el);

    const newNode = h('div', null, 'a');
    const d = diff(oldNode, newNode);
    patch(el, d);

    expect(el.textContent).toBe('a');
  });

  test('full replace cycle', () => {
    const oldNode = h('div', null, 'x');
    const el = asEl(oldNode);
    container.appendChild(el);

    const newNode = h('span', { class: 'replaced' }, 'y');
    const d = diff(oldNode, newNode);
    patch(el, d);

    expect(container.querySelector('span')).not.toBeNull();
    expect(container.textContent).toBe('y');
  });

  test('complex nested update (level 3+)', () => {
    const oldNode = vn(
      'div',
      { class: 'container' },
      vn(
        'section',
        { id: 'main' },
        vn('ul', {}, vn('li', { class: 'item' }, 'item1'), vn('li', {}, 'item2')),
      ),
    );
    const el = asEl(oldNode);
    container.appendChild(el);

    const newNode = vn(
      'div',
      { class: 'container updated' },
      vn(
        'section',
        { id: 'main' },
        vn(
          'ul',
          {},
          vn('li', { class: 'item changed' }, 'item1'),
          vn('li', {}, 'item2'),
          vn('li', {}, 'item3'),
        ),
      ),
    );
    const d = diff(oldNode, newNode);
    patch(el, d);

    expect(el.className).toBe('container updated');
    const items = el.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0].className).toBe('item changed');
    expect(items[2].textContent).toBe('item3');
  });

  test('event handler update cycle', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const node = h('button', { onClick: handler1 }, 'click');
    const el = render(node) as HTMLButtonElement;
    container.appendChild(el);

    el.click();
    expect(handler1).toHaveBeenCalledTimes(1);

    const newNode = h('button', { onClick: handler2 }, 'click');
    const d = diff(node, newNode);
    patch(el, d);

    el.click();
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});

describe('Renderer class', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  afterEach(() => {
    container.innerHTML = '';
  });

  test('initial render', () => {
    const initial = h('div', { class: 'app' }, 'Hello');
    const renderer = new Renderer(initial);
    renderer.render('root');
    const el = container.querySelector('div');
    expect(el?.className).toBe('app');
    expect(el?.textContent).toBe('Hello');
  });

  test('update applies diff and patch', () => {
    const initial = h('div', null, 'initial');
    const renderer = new Renderer(initial);
    renderer.render('root');

    renderer.update(h('div', null, 'updated'));
    expect(container.textContent).toBe('updated');
  });

  test('update throws if called before render', () => {
    const initial = h('div', null, 'x');
    const renderer = new Renderer(initial);

    expect(() => renderer.update(h('div', null, 'y'))).toThrow(
      'Cannot patch before initial render',
    );
  });

  test('update handles props changes', () => {
    const initial = h('div', { class: 'old' }, 'text');
    const renderer = new Renderer(initial);
    renderer.render('root');

    renderer.update(h('div', { class: 'new' }, 'text'));
    expect(container.querySelector('div')?.className).toBe('new');
  });

  test('update handles nested structure', () => {
    const initial = vn('div', {}, vn('ul', {}, vn('li', {}, 'a'), vn('li', {}, 'b')));
    const renderer = new Renderer(initial);
    renderer.render('root');

    renderer.update(
      vn('div', {}, vn('ul', {}, vn('li', {}, 'a'), vn('li', {}, 'b'), vn('li', {}, 'c'))),
    );

    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[2].textContent).toBe('c');
  });

  test('throws if container element not found', () => {
    const initial = h('div', null, 'x');
    const renderer = new Renderer(initial);

    expect(() => renderer.render('nonexistent')).toThrow(
      'Container element with ID "nonexistent" not found',
    );
  });
});

describe('Edge cases', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  test('empty VNode children array', () => {
    const node = h('div', null);
    const el = asEl(node);
    expect(el.children).toHaveLength(0);
  });

  test('all null/undefined/false children produces empty children array', () => {
    const node = h('div', null, null, undefined, false);
    expect(node.children).toHaveLength(0);
  });

  test('diff identical deep trees returns NONE', () => {
    const a = vn('div', {}, vn('span', { class: 'x' }, 'text'), vn('ul', {}, vn('li', {}, 'item')));
    const b = vn('div', {}, vn('span', { class: 'x' }, 'text'), vn('ul', {}, vn('li', {}, 'item')));
    const p = diff(a, b);
    expect(p.type).toBe('NONE');
  });

  test('patch works with composite of multiple changes', () => {
    const node = h('div', { class: 'a', id: 'x' }, 'old');
    const el = asEl(node);
    container.appendChild(el);

    const d = diff(
      h('div', { class: 'a', id: 'x' }, 'old'),
      h('div', { class: 'b', id: 'y', data: 'z' }, 'new'),
    );
    patch(el, d);

    expect(el.className).toBe('b');
    expect(el.id).toBe('y');
    expect(el.getAttribute('data')).toBe('z');
    expect(el.textContent).toBe('new');
  });

  test('style prop with multiple CSS properties', () => {
    const node = h(
      'div',
      {
        style: {
          color: 'blue',
          backgroundColor: 'red',
          fontSize: '16px',
          margin: '10px',
        },
      },
      'x',
    );
    const el = asEl(node);
    expect(el.style.color).toBe('blue');
    expect(el.style.backgroundColor).toBe('red');
    expect(el.style.fontSize).toBe('16px');
    expect(el.style.margin).toBe('10px');
  });
});

describe('keyed diff (Phase 3.1)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  test('h() extracts key from props into the VNode (never reaches DOM)', () => {
    const node = h('div', { key: 'a', class: 'x' }, 'c');
    expect(node.key).toBe('a');
    expect(node.props).toEqual({ class: 'x' });
    const el = asEl(node);
    expect(el.hasAttribute('key')).toBe(false);
    expect(el.className).toBe('x');
  });

  test('h() keeps numeric keys', () => {
    const node = h('div', { key: 7 }, 'c');
    expect(node.key).toBe(7);
  });

  test('unkeyed parity: append yields insert ops beyond old length', () => {
    const p = diff(h('div', null, 'a'), h('div', null, 'a', 'b', 'c')) as any;
    expect(p.ops).toEqual([
      { op: 'insert', index: 1, vnode: 'b' },
      { op: 'insert', index: 2, vnode: 'c' },
    ]);
  });

  test('unkeyed parity: removal yields remove ops at surplus indices', () => {
    const p = diff(h('div', null, 'a', 'b', 'c'), h('div', null, 'a')) as any;
    expect(p.ops).toEqual([
      { op: 'remove', index: 1 },
      { op: 'remove', index: 2 },
    ]);
  });

  test('unkeyed parity: positional patch', () => {
    const p = diff(
      h('div', null, h('span', { class: 'a' }, 'x')),
      h('div', null, h('span', { class: 'b' }, 'x')),
    ) as any;
    expect(p.ops).toEqual([
      {
        op: 'patch',
        index: 0,
        patch: { type: 'PROPS', added: {}, updated: { class: 'b' }, removed: [] },
      },
    ]);
  });

  test('keyed mid-list insert targets only the inserted index', () => {
    const A = h('li', { key: 'a' }, 'A');
    const B = h('li', { key: 'b' }, 'B');
    const C = h('li', { key: 'c' }, 'C');
    const X = h('li', { key: 'x' }, 'X');
    const oldList = h('ul', null, A, B, C);
    const newList = h('ul', null, A, X, B, C);

    const p = diff(oldList, newList) as any;
    expect(p.type).toBe('CHILDREN');
    expect(p.ops).toEqual([{ op: 'insert', index: 1, vnode: X }]);

    // Integration: B/C DOM rows keep their element refs untouched.
    const ul = asEl(oldList);
    container.appendChild(ul);
    const bEl = ul.querySelectorAll('li')[1];
    patch(ul, p);
    const lis = ul.querySelectorAll('li');
    expect(lis).toHaveLength(4);
    expect([...lis].map((li) => li.textContent)).toEqual(['A', 'X', 'B', 'C']);
    expect(lis[2]).toBe(bEl);
  });

  test('keyed mid-list remove yields a single remove op', () => {
    const A = h('li', { key: 'a' }, 'A');
    const B = h('li', { key: 'b' }, 'B');
    const C = h('li', { key: 'c' }, 'C');
    const p = diff(h('ul', null, A, B, C), h('ul', null, A, C)) as any;
    expect(p.type).toBe('CHILDREN');
    expect(p.ops).toEqual([{ op: 'remove', index: 1 }]);
  });

  test('REPLACE-on-key-match: same key, different tag → in-place replace', () => {
    const oldList = h('ul', null, h('li', { key: 'a' }, 'A'));
    const newSpan = h('span', { key: 'a' }, 'A');
    const newList = h('ul', null, newSpan);
    const p = diff(oldList, newList) as any;
    expect(p.ops).toEqual([
      { op: 'patch', index: 0, patch: { type: 'REPLACE', newNode: newSpan } },
    ]);

    const ul = asEl(oldList);
    container.appendChild(ul);
    patch(ul, p);
    expect(ul.querySelector('span')).not.toBeNull();
    expect(ul.querySelectorAll('li')).toHaveLength(0);
  });

  test('mixed keyed/unkeyed: unkeyed child at unconsumed keyed slot → positional fallback', () => {
    const K = h('li', { key: 'k' }, 'K');
    const L = h('li', { key: 'l' }, 'L');
    const U = h('li', null, 'U');
    const p = diff(h('ul', null, K, L), h('ul', null, U, L)) as any;
    expect(p.type).toBe('CHILDREN');
    expect(p.ops).toHaveLength(1);
    expect(p.ops[0].op).toBe('patch');
    expect(p.ops[0].index).toBe(0);
    expect(p.ops[0].patch.type).toBe('CHILDREN');

    const ul = asEl(h('ul', null, K, L));
    container.appendChild(ul);
    patch(ul, p);
    expect([...ul.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['U', 'L']);
  });

  test('reorder → positional fallback (content per position, no moves)', () => {
    const A = h('li', { key: 'a' }, 'A');
    const B = h('li', { key: 'b' }, 'B');
    const p = diff(h('ul', null, A, B), h('ul', null, B, A)) as any;
    expect(p.type).toBe('CHILDREN');
    expect(p.ops).toEqual([
      { op: 'patch', index: 0, patch: expect.anything() },
      { op: 'patch', index: 1, patch: expect.anything() },
    ]);

    const ul = asEl(h('ul', null, A, B));
    container.appendChild(ul);
    patch(ul, p);
    expect([...ul.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['B', 'A']);
  });

  test('duplicate keys → unkeyed fallback (no corruption)', () => {
    const D1 = h('li', { key: 'dup' }, 'D1');
    const D2 = h('li', { key: 'dup' }, 'D2');
    const ul = asEl(h('ul', null, D1));
    container.appendChild(ul);
    const p = diff(h('ul', null, D1), h('ul', null, D2, D1)) as any;
    patch(ul, p);
    const lis = ul.querySelectorAll('li');
    expect(lis).toHaveLength(2);
    expect(lis[0].textContent).toBe('D2');
    expect(lis[1].textContent).toBe('D1');
  });
});

describe('CHILDREN patch drift safety (Phase 3.2)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  test('removes at [2,5] applied end→start — no drift', () => {
    const el = asEl(h('div', null, 'a', 'b', 'c', 'd', 'e', 'f', 'g'));
    container.appendChild(el);
    patch(el, {
      type: 'CHILDREN',
      ops: [
        { op: 'remove', index: 2 },
        { op: 'remove', index: 5 },
      ],
    });
    expect([...el.childNodes].map((n) => n.textContent)).toEqual(['a', 'b', 'd', 'e', 'g']);
  });

  test('remove + insert at the same index (B removed, X lands in its slot)', () => {
    const el = asEl(h('div', null, 'a', 'b', 'c'));
    container.appendChild(el);
    patch(el, {
      type: 'CHILDREN',
      ops: [
        { op: 'remove', index: 1 },
        { op: 'insert', index: 1, vnode: 'X' },
      ],
    });
    expect([...el.childNodes].map((n) => n.textContent)).toEqual(['a', 'X', 'c']);
  });

  test('insert + patch same index (anchor + in-place patch on old-space node)', () => {
    const el = asEl(h('div', null, 'a', 'b', 'c'));
    container.appendChild(el);
    patch(el, {
      type: 'CHILDREN',
      ops: [
        { op: 'insert', index: 1, vnode: 'X' },
        { op: 'patch', index: 1, patch: { type: 'TEXT', newText: 'B2' } },
      ],
    });
    expect([...el.childNodes].map((n) => n.textContent)).toEqual(['a', 'X', 'B2', 'c']);
  });

  test('append = insert beyond old length', () => {
    const el = asEl(h('div', null, 'a', 'b'));
    container.appendChild(el);
    patch(el, { type: 'CHILDREN', ops: [{ op: 'insert', index: 2, vnode: 'c' }] });
    expect([...el.childNodes].map((n) => n.textContent)).toEqual(['a', 'b', 'c']);
  });

  test('REPLACE then later insert anchors to the replaced node', () => {
    const el = asEl(h('div', null, 'a', 'b'));
    container.appendChild(el);
    patch(el, {
      type: 'CHILDREN',
      ops: [
        { op: 'patch', index: 0, patch: { type: 'REPLACE', newNode: h('span', null, 'A') } },
        { op: 'insert', index: 1, vnode: 'X' },
      ],
    });
    expect((el.childNodes[0] as HTMLElement).tagName).toBe('SPAN');
    expect(el.childNodes[0].textContent).toBe('A');
    expect(el.childNodes[1].textContent).toBe('X');
    expect(el.childNodes[2].textContent).toBe('b');
  });
});

describe('listener stability (Phase 3.3)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  test('setProp identity guard: same handler ref → NOT re-registered', () => {
    const handler = vi.fn();
    const node = h('button', { onClick: handler }, 'click');
    const el = render(node) as HTMLButtonElement;
    container.appendChild(el);
    el.click();
    expect(handler).toHaveBeenCalledTimes(1);

    const addSpy = vi.spyOn(el, 'addEventListener');
    const removeSpy = vi.spyOn(el, 'removeEventListener');

    patch(el, { type: 'PROPS', added: {}, updated: { onClick: handler }, removed: [] });

    expect(addSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    el.click();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  test('setProp re-registers when handler ref changes', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const el = render(h('button', { onClick: h1 }, 'click')) as HTMLButtonElement;
    container.appendChild(el);

    const addSpy = vi.spyOn(el, 'addEventListener');
    const removeSpy = vi.spyOn(el, 'removeEventListener');

    patch(el, { type: 'PROPS', added: {}, updated: { onClick: h2 }, removed: [] });

    expect(removeSpy).toHaveBeenCalledWith('click', h1);
    expect(addSpy).toHaveBeenCalledWith('click', h2);
    el.click();
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledTimes(1);
  });

  test('btnIcon dataAction renders the attr and reuses the passed handler (stable ref)', () => {
    const handler = vi.fn();
    const node = btnIcon('<svg></svg>', { dataAction: 'close-tab', onClick: handler });
    const el = asEl(node);
    container.appendChild(el);

    expect(el.getAttribute('data-action')).toBe('close-tab');
    expect((el as any).__vdom_listeners?.click).toBe(handler);

    // Same handler ref re-patched → no re-registration.
    const addSpy = vi.spyOn(el, 'addEventListener');
    patch(el, { type: 'PROPS', added: {}, updated: { onClick: handler }, removed: [] });
    expect(addSpy).not.toHaveBeenCalled();

    el.click();
    expect(handler).toHaveBeenCalledTimes(1);
    // Delegated mode has NO wrapper → no text-error class, no stopPropagation.
    expect(el.classList.contains('text-error')).toBe(false);
    const containerSpy = vi.fn();
    container.addEventListener('click', containerSpy);
    el.click();
    expect(containerSpy).toHaveBeenCalledTimes(1);
  });

  test('btnIcon doubleConfirmation state intact (no regression)', () => {
    const action = vi.fn();
    const node = btnIcon('<svg></svg>', { onClick: action, doubleConfirmation: true });
    const el = asEl(node);
    container.appendChild(el);

    const containerSpy = vi.fn();
    container.addEventListener('click', containerSpy);

    el.click();
    expect(action).not.toHaveBeenCalled();
    expect(el.classList.contains('text-error')).toBe(true);
    expect(containerSpy).not.toHaveBeenCalled(); // wrapper stops propagation

    el.click();
    expect(action).toHaveBeenCalledTimes(1);
    expect(containerSpy).not.toHaveBeenCalled();
  });
});

describe('Desktops stable handlers (REQ-08)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  // Build the same row shape Desktops.astro produces: an outer div carrying
  // `data-desktop-id`, with the stable handlers on the clickable inner div.
  function desktopRowVNode(id: number): VNode {
    return h(
      'div',
      { key: id, 'data-desktop-id': String(id) },
      h('div', { onclick: selectDesktopFromEvent, oncontextmenu: desktopMenuFromEvent }, id),
    );
  }

  test('desktop row listeners attach the module-level stable handlers (no per-call closure)', () => {
    const row = desktopRowVNode(1);
    const el = asEl(row);
    container.appendChild(el);

    const circle = el.querySelector('div') as HTMLElement;
    expect((circle as any).__vdom_listeners?.click).toBe(selectDesktopFromEvent);
    expect((circle as any).__vdom_listeners?.contextmenu).toBe(desktopMenuFromEvent);
  });

  test('desktop row re-diff with the same handler refs → no re-registration (identity guard)', () => {
    const el = asEl(desktopRowVNode(1));
    container.appendChild(el);
    const circle = el.querySelector('div') as HTMLElement;

    const addSpy = vi.spyOn(circle, 'addEventListener');
    const removeSpy = vi.spyOn(circle, 'removeEventListener');

    // Same stable handler refs re-propagated → setProp guard skips remove/add.
    patch(el, {
      type: 'PROPS',
      added: {},
      updated: { onclick: selectDesktopFromEvent, oncontextmenu: desktopMenuFromEvent },
      removed: [],
    });

    expect(addSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    // The existing listeners still dispatch to the module-level handlers.
    expect((circle as any).__vdom_listeners?.click).toBe(selectDesktopFromEvent);
  });

  test('desktopIdFromEvent resolves the id from the closest [data-desktop-id] ancestor', () => {
    const row = document.createElement('div');
    row.setAttribute('data-desktop-id', '7');
    const inner = document.createElement('span');
    row.appendChild(inner);
    container.appendChild(row);

    // Event arriving from a nested element still resolves the row id.
    expect(desktopIdFromEvent({ currentTarget: inner } as unknown as Event)).toBe(7);
    // Event from an element outside any desktop row → null.
    const outside = document.createElement('div');
    container.appendChild(outside);
    expect(desktopIdFromEvent({ currentTarget: outside } as unknown as Event)).toBe(null);
  });
});

describe('Renderer + renderTab memo (Phase 3.4, refresh-one flow)', () => {
  let container: HTMLElement;

  interface TabLike {
    id: number;
    title: string;
  }

  let tabMemo: WeakMap<TabLike, VNode>;

  function memoRenderTab(t: TabLike): VNode {
    const hit = tabMemo.get(t);
    if (hit) return hit;
    const v = h(
      'div',
      { key: String(t.id), 'data-tab-id': String(t.id), class: 'memo-row' },
      h('span', { class: 'memo-title' }, t.title),
    );
    tabMemo.set(t, v);
    return v;
  }

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
    tabMemo = new WeakMap();
  });

  test('refresh-one: only the changed tab row is touched', () => {
    const t1 = { id: 1, title: 'One' };
    const t2 = { id: 2, title: 'Two' };
    const t3 = { id: 3, title: 'Three' };

    const renderer = new Renderer(
      h('div', null, memoRenderTab(t1), memoRenderTab(t2), memoRenderTab(t3)),
    );
    renderer.render('root');

    const rows = container.querySelectorAll('.memo-row');
    const row1 = rows[0];
    const row3 = rows[2];
    const title1Node = row1.querySelector('.memo-title')!.firstChild;
    const title3Node = row3.querySelector('.memo-title')!.firstChild;

    // updateTabInContainers pattern: FRESH object only for the changed tab.
    const t2b = { id: 2, title: 'Two updated' };
    renderer.update(h('div', null, memoRenderTab(t1), memoRenderTab(t2b), memoRenderTab(t3)));

    const after = container.querySelectorAll('.memo-row');
    expect(after).toHaveLength(3);
    expect(after[0]).toBe(row1); // same element
    expect(after[1].querySelector('.memo-title')!.textContent).toBe('Two updated');
    expect(after[2]).toBe(row3); // same element

    // Untouched rows keep their exact text nodes (subtree diff collapsed to NONE).
    expect(after[0].querySelector('.memo-title')!.firstChild).toBe(title1Node);
    expect(after[2].querySelector('.memo-title')!.firstChild).toBe(title3Node);
  });

  test('memo hits return the same VNode ref; memoized VNode never mutated in place', () => {
    const t1 = { id: 1, title: 'One' };
    const t2 = { id: 2, title: 'Two' };

    const renderer = new Renderer(h('div', null, memoRenderTab(t1), memoRenderTab(t2)));
    renderer.render('root');

    const v1First = memoRenderTab(t1);
    const titleBefore = (v1First.children[0] as VNode).children[0];

    const t2b = { id: 2, title: 'Two updated' };
    renderer.update(h('div', null, memoRenderTab(t1), memoRenderTab(t2b)));

    const v1After = memoRenderTab(t1);
    expect(v1After).toBe(v1First);
    expect((v1After.children[0] as VNode).children[0]).toBe(titleBefore);
    expect(container.querySelectorAll('.memo-title')[0].textContent).toBe('One');
  });
});

describe('style diff (L2 vdom)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById('root')!;
    container.innerHTML = '';
  });

  afterEach(() => {
    container.innerHTML = '';
  });

  test('removed style properties are cleared from the DOM, not just overwritten', () => {
    const renderer = new Renderer(h('div', { style: { color: 'red', fontSize: '14px' } }));
    renderer.render('root', { replace: true });
    const real = container.querySelector('div')!;

    expect(real.style.color).toBe('red');
    expect(real.style.fontSize).toBe('14px');

    renderer.update(h('div', { style: { color: 'blue' } }));

    expect(real.style.color).toBe('blue');
    // The old fontSize must NOT linger — this is the regression the style
    // diff guards against (Object.assign alone would leave it).
    expect(real.style.fontSize).toBe('');
  });

  test('style={null} clears all inline styles', () => {
    const renderer = new Renderer(h('div', { style: { color: 'red', fontSize: '14px' } }));
    renderer.render('root', { replace: true });
    const real = container.querySelector('div')!;

    expect(real.style.color).toBe('red');

    // Re-render with style={null} — goes through removeProp('style'), which
    // must clear the style attribute AND the VDOM_STYLE_KEY side-channel.
    renderer.update(h('div', { style: null as never }));

    expect(real.getAttribute('style')).toBeNull();
    expect((real as unknown as Record<string, unknown>).__vdom_prev_style).toBeUndefined();
  });
});

describe('CHILDREN patch drift warnings (L3 vdom)', () => {
  test('warns in dev when a patch op is orphaned by a prior remove at the same index', () => {
    // Build a patch with both a remove and a patch at index 0 in the same
    // children list — diff() never emits this combination in normal use.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const el = render(h('div', null, h('span', null, 'A')));
    const patchOp: Patch = {
      type: 'CHILDREN',
      ops: [
        { op: 'remove', index: 0 },
        { op: 'patch', index: 0, patch: { type: 'TEXT', newText: 'B' } },
      ],
    };
    patch(el, patchOp);
    expect(warnSpy).toHaveBeenCalled();
    const callArgs = warnSpy.mock.calls[0] as unknown[];
    const firstArg = callArgs[0] as string;
    expect(firstArg).toContain('[vdom]');
    expect(firstArg).toContain('patch op at index');
    expect(callArgs).toContain(0);
    expect(callArgs.some((a) => typeof a === 'string' && a.includes('orphaned'))).toBe(true);
    warnSpy.mockRestore();
  });
});
