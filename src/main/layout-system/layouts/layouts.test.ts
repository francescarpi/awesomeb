import { expect, test } from 'vitest';
import { LSVerticalLayout } from './vertical';
import { LSView } from '../view';
import { LSHorizontalLayout } from './horizontal';

function createLayout(): LSVerticalLayout {
  const layout1 = new LSVerticalLayout();

  const v1 = new LSView('v1');

  const layout2 = new LSHorizontalLayout();
  const v2 = new LSView('v2');
  const v3 = new LSView('v3');

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
