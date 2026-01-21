import { expect, test } from 'vitest';
import { UIVerticalLayout } from './vertical';
import { UIView } from '../view';
import { UIHorizontalLayout } from './horizontal';

function createLayout(): UIVerticalLayout {
  const layout1 = new UIVerticalLayout();

  const v1 = new UIView('v1');

  const layout2 = new UIHorizontalLayout();
  const v2 = new UIView('v2');
  const v3 = new UIView('v3');

  layout2.add(v2);
  layout2.add(v3);

  layout1.add(v1);
  layout1.add(layout2);

  return layout1;
}

test('layout should return expected views', () => {
  const root = createLayout();
  expect(root.views.length).toBe(3);
  expect(root.views[0].page).toContain('v1');
  expect(root.views[1].page).toContain('v2');
  expect(root.views[2].page).toContain('v3');
});

test('layout should epected visible children', () => {
  const root = createLayout();
  expect(root.visibleChildren.length).toBe(2);
});
