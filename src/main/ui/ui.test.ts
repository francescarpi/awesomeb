import { expect, test } from 'vitest';
import { UINewLayout } from './new-layout';
import { UINewPageView } from './new-view';

test('should create a basic vertical layout', () => {
  const layout = new UINewLayout('test-layout', 'vertical');
  expect(layout.id).toBe('test-layout');
  expect(layout.type).toBe('vertical');
  expect(layout.children.length).toBe(0);
});

test('should create a basic horizontal layout', () => {
  const layout = new UINewLayout('test-layout', 'horizontal');
  expect(layout.id).toBe('test-layout');
  expect(layout.type).toBe('horizontal');
  expect(layout.children.length).toBe(0);
});

test('should create a basic fixed layout', () => {
  const layout = new UINewLayout('test-layout', { x: 0, y: 0, width: 100, height: 100 });
  expect(layout.id).toBe('test-layout');
  expect(layout.type).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  expect(layout.children.length).toBe(0);
});

test('should create a new page view', () => {
  const pageView = new UINewPageView('test-page');
  expect(pageView.page).toBe('test-page');
});
