import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { h, render, diff, patch, Renderer } from './vdom';
import type { VNode, VNodeProps } from './types';

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

  test('returns CHILDREN with appended children', () => {
    const oldNode = h('div', null, 'a');
    const newNode = h('div', null, 'a', 'b', 'c');
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('CHILDREN');
    expect(p.append).toHaveLength(2);
  });

  test('returns CHILDREN with removed children', () => {
    const oldNode = h('div', null, 'a', 'b', 'c');
    const newNode = h('div', null, 'a');
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('CHILDREN');
    expect(p.remove).toBe(2);
  });

  test('returns CHILDREN with patch for nested children', () => {
    const oldNode = h('div', null, h('span', { class: 'item' }, 'old'));
    const newNode = h('div', null, h('span', { class: 'item' }, 'new'));
    const p = diff(oldNode, newNode) as any;
    expect(p.type).toBe('CHILDREN');
    expect(p.patches[0].type).toBe('CHILDREN');
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
      patches: [{ type: 'TEXT', newText: 'new' }],
      append: [],
      remove: 0,
    });
    expect(el.textContent).toBe('new');
  });

  test('CHILDREN removes surplus old children', () => {
    const node = h('div', null, 'a', 'b', 'c');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, { type: 'CHILDREN', patches: [], append: [], remove: 2 });
    expect(el.textContent).toBe('a');
  });

  test('CHILDREN appends new children', () => {
    const node = h('div', null, 'a');
    const el = asEl(node);
    container.appendChild(el);

    patch(el, { type: 'CHILDREN', patches: [], append: ['b', 'c'], remove: 0 });
    expect(el.textContent).toBe('abc');
  });

  test('CHILDREN handles deep nested structure', () => {
    const node = vn('div', {}, vn('ul', {}, vn('li', {}, 'item1')));
    const el = asEl(node);
    container.appendChild(el);

    patch(el, {
      type: 'CHILDREN',
      patches: [
        {
          type: 'CHILDREN',
          patches: [
            {
              type: 'CHILDREN',
              patches: [{ type: 'TEXT', newText: 'updated' }],
              append: [],
              remove: 0,
            },
          ],
          append: [],
          remove: 0,
        },
      ],
      append: [],
      remove: 0,
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
        { type: 'CHILDREN', patches: [{ type: 'TEXT', newText: 'new' }], append: [], remove: 0 },
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
    const renderer = new Renderer(initial, 'root');

    renderer.render();
    const el = container.querySelector('div');
    expect(el?.className).toBe('app');
    expect(el?.textContent).toBe('Hello');
  });

  test('update applies diff and patch', () => {
    const initial = h('div', null, 'initial');
    const renderer = new Renderer(initial, 'root');
    renderer.render();

    renderer.update(h('div', null, 'updated'));
    expect(container.textContent).toBe('updated');
  });

  test('update throws if called before render', () => {
    const initial = h('div', null, 'x');
    const renderer = new Renderer(initial, 'root');

    expect(() => renderer.update(h('div', null, 'y'))).toThrow(
      'Cannot patch before initial render',
    );
  });

  test('update handles props changes', () => {
    const initial = h('div', { class: 'old' }, 'text');
    const renderer = new Renderer(initial, 'root');
    renderer.render();

    renderer.update(h('div', { class: 'new' }, 'text'));
    expect(container.querySelector('div')?.className).toBe('new');
  });

  test('update handles nested structure', () => {
    const initial = vn('div', {}, vn('ul', {}, vn('li', {}, 'a'), vn('li', {}, 'b')));
    const renderer = new Renderer(initial, 'root');
    renderer.render();

    renderer.update(
      vn('div', {}, vn('ul', {}, vn('li', {}, 'a'), vn('li', {}, 'b'), vn('li', {}, 'c'))),
    );

    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[2].textContent).toBe('c');
  });

  test('throws if container element not found', () => {
    const initial = h('div', null, 'x');
    const renderer = new Renderer(initial, 'nonexistent');

    expect(() => renderer.render()).toThrow('Container element with ID "nonexistent" not found');
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
