import { expect, test } from 'vitest';
import { UIVerticalLayout } from './vertical';
import { UIView, UIPageView } from '../view';
import { UIHorizontalLayout } from './horizontal';

// TODO: This file is deprecated
function createLayout(): UIVerticalLayout {
  const layout1 = new UIVerticalLayout('l1');
  const layout2 = new UIHorizontalLayout('l2');

  const v1 = new UIPageView('v1');
  const v2 = new UIPageView('v2');
  const v3 = new UIView();

  layout2.add(v2);
  layout2.add(v3);

  layout1.add(v1);
  layout1.add(layout2);

  return layout1;
}

test('layout should return expected views', () => {
  const root = createLayout();
  expect(root.id).toBe('l1');

  expect(root.views.length).toBe(3);
  expect(root.views[0].id).toBe('v1');
  expect(root.views[1].id).toBe('v2');
  expect(root.views[2].id).toBe(1);
});

test('layout should epected visible children', () => {
  const root = createLayout();
  expect(root.visibleChildren.length).toBe(2);
});

test('should access to specific view or layout by id', () => {
  const root = createLayout();

  const v3 = root.getNodeById(1);
  expect(v3).not.toBeNull();
  expect(v3!.id).toBe(1);

  const l2 = root.getNodeById('l2');
  expect(l2).not.toBeNull();
  expect(l2!.id).toBe('l2');
});
