import { describe, expect, test } from 'vitest';
import { OrderIndex } from './order-index';

describe('OrderIndex', () => {
  test('add inserts at the end when no justAfter', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.add(3);
    expect(idx.toArray()).toEqual([1, 2, 3]);
  });

  test('add with justAfter inserts immediately after target', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.add(3);
    idx.add(4, 1);
    expect(idx.toArray()).toEqual([1, 4, 2, 3]);
  });

  test('add with justAfter at the end appends after last', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.add(3);
    idx.add(4, 3);
    expect(idx.toArray()).toEqual([1, 2, 3, 4]);
  });

  test('add with non-existent justAfter falls back to append at end', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.add(3, 99);
    expect(idx.toArray()).toEqual([1, 2, 3]);
  });

  test('add duplicate id is a no-op (idempotent)', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.add(2);
    expect(idx.toArray()).toEqual([1, 2]);
  });

  test('add on empty index sets first and last', () => {
    const idx = new OrderIndex<number>();
    idx.add(5);
    expect(idx.first).toBe(5);
    expect(idx.last).toBe(5);
    expect(idx.size).toBe(1);
  });

  test('remove of middle element re-links neighbors', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.add(3);
    idx.add(4);
    idx.remove(2);
    expect(idx.toArray()).toEqual([1, 3, 4]);
    expect(idx.getNext(1)).toBe(3);
    expect(idx.getPrev(3)).toBe(1);
  });

  test('remove of first element updates _first', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.add(3);
    idx.remove(1);
    expect(idx.toArray()).toEqual([2, 3]);
    expect(idx.first).toBe(2);
  });

  test('remove of last element updates _last', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.add(3);
    idx.remove(3);
    expect(idx.toArray()).toEqual([1, 2]);
    expect(idx.last).toBe(2);
  });

  test('remove of only element resets to empty', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.remove(1);
    expect(idx.toArray()).toEqual([]);
    expect(idx.first).toBeNull();
    expect(idx.last).toBeNull();
    expect(idx.size).toBe(0);
  });

  test('remove of non-existent id is a no-op', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.remove(99);
    expect(idx.toArray()).toEqual([1, 2]);
  });

  test('has returns true for present id, false otherwise', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    expect(idx.has(1)).toBe(true);
    expect(idx.has(2)).toBe(false);
  });

  test('clear empties the index', () => {
    const idx = new OrderIndex<number>();
    idx.add(1);
    idx.add(2);
    idx.add(3);
    idx.clear();
    expect(idx.toArray()).toEqual([]);
    expect(idx.size).toBe(0);
    expect(idx.first).toBeNull();
    expect(idx.last).toBeNull();
  });

  describe('getNext / getPrev', () => {
    test('getNext of middle element returns immediate next', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      expect(idx.getNext(2)).toBe(3);
    });

    test('getNext of last element returns null', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      expect(idx.getNext(3)).toBeNull();
    });

    test('getPrev of middle element returns immediate prev', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      expect(idx.getPrev(2)).toBe(1);
    });

    test('getPrev of first element returns null', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      expect(idx.getPrev(1)).toBeNull();
    });

    test('getNext of non-existent id returns null', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      expect(idx.getNext(99)).toBeNull();
    });

    test('getNext with skipExcluded jumps over excluded elements', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.add(4);
      idx.exclude(2);
      expect(idx.getNext(1)).toBe(2);
      expect(idx.getNext(1, { skipExcluded: true })).toBe(3);
    });

    test('getPrev with skipExcluded jumps over excluded elements', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.add(4);
      idx.exclude(3);
      expect(idx.getPrev(4)).toBe(3);
      expect(idx.getPrev(4, { skipExcluded: true })).toBe(2);
    });

    test('getNext with skipExcluded returns null when everything ahead is excluded', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.exclude(2);
      idx.exclude(3);
      expect(idx.getNext(1, { skipExcluded: true })).toBeNull();
    });
  });

  describe('exclude / include', () => {
    test('exclude removes from active list but keeps in nodes', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.exclude(2);
      expect(idx.toArray()).toEqual([1, 3]);
      expect(idx.toArray({ includeExcluded: true })).toEqual([1, 2, 3]);
      expect(idx.size).toBe(3);
      expect(idx.activeSize).toBe(2);
    });

    test('exclude of first updates _first', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.exclude(1);
      expect(idx.toArray()).toEqual([2, 3]);
      expect(idx.first).toBe(2);
    });

    test('exclude of last updates _last', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.exclude(3);
      expect(idx.toArray()).toEqual([1, 2]);
      expect(idx.last).toBe(2);
    });

    test('include restores physical order without re-positioning', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.exclude(2);
      idx.include(2);
      expect(idx.toArray()).toEqual([1, 2, 3]);
    });

    test('include with justAfter inserts at specified position', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.exclude(2);
      idx.include(2, 1);
      expect(idx.toArray()).toEqual([1, 2, 3]);
    });

    test('exclude of non-existent id is a no-op', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.exclude(99);
      expect(idx.toArray()).toEqual([1]);
    });

    test('exclude of already-excluded id is a no-op', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.exclude(1);
      idx.exclude(1);
      expect(idx.toArray()).toEqual([2]);
    });

    test('isExcluded reflects state', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      expect(idx.isExcluded(1)).toBe(false);
      idx.exclude(1);
      expect(idx.isExcluded(1)).toBe(true);
      idx.include(1);
      expect(idx.isExcluded(1)).toBe(false);
    });
  });

  describe('moveAfter / moveBefore', () => {
    test('moveAfter moves id to be immediately after target', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.add(4);
      idx.moveAfter(1, 3);
      expect(idx.toArray()).toEqual([2, 3, 1, 4]);
    });

    test('moveBefore moves id to be immediately before target', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.add(4);
      idx.moveBefore(4, 1);
      expect(idx.toArray()).toEqual([4, 1, 2, 3]);
    });

    test('moveBefore when target is first moves id to the very beginning', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.moveBefore(3, 1);
      expect(idx.toArray()).toEqual([3, 1, 2]);
      expect(idx.first).toBe(3);
    });

    test('moveAfter when target is last moves id to the very end', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.moveAfter(1, 3);
      expect(idx.toArray()).toEqual([2, 3, 1]);
      expect(idx.last).toBe(1);
    });

    test('moveAfter with same id is a no-op', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.moveAfter(1, 1);
      expect(idx.toArray()).toEqual([1, 2]);
    });

    test('moveAfter with non-existent id is a no-op', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.moveAfter(99, 1);
      expect(idx.toArray()).toEqual([1, 2]);
    });
  });

  describe('move (up/down)', () => {
    test('move up swaps id with the previous element', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.move(2, 'up');
      expect(idx.toArray()).toEqual([2, 1, 3]);
    });

    test('move down swaps id with the next element', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.move(2, 'down');
      expect(idx.toArray()).toEqual([1, 3, 2]);
    });

    test('move up of first element is a no-op', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.move(1, 'up');
      expect(idx.toArray()).toEqual([1, 2, 3]);
    });

    test('move down of last element is a no-op', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.move(3, 'down');
      expect(idx.toArray()).toEqual([1, 2, 3]);
    });

    test('move up with skipExcluded jumps over excluded element', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.add(4);
      idx.exclude(2);
      idx.move(3, 'up', { skipExcluded: true });
      expect(idx.toArray()).toEqual([3, 1, 4]);
    });

    test('move down with skipExcluded jumps over excluded element', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.add(4);
      idx.exclude(3);
      idx.move(2, 'down', { skipExcluded: true });
      expect(idx.toArray()).toEqual([1, 4, 2]);
    });

    test('move up skips multiple consecutive excluded elements', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.add(4);
      idx.add(5);
      idx.exclude(3);
      idx.exclude(4);
      idx.move(5, 'up', { skipExcluded: true });
      expect(idx.toArray()).toEqual([1, 5, 2]);
    });
  });

  describe('toArray / getPosition', () => {
    test('toArray default excludes excluded items', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.exclude(2);
      expect(idx.toArray()).toEqual([1, 3]);
    });

    test('toArray with includeExcluded returns all items in order', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.exclude(2);
      expect(idx.toArray({ includeExcluded: true })).toEqual([1, 2, 3]);
    });

    test('toArray on empty index returns empty array', () => {
      const idx = new OrderIndex<number>();
      expect(idx.toArray()).toEqual([]);
    });

    test('getPosition returns 0-based index', () => {
      const idx = new OrderIndex<number>();
      idx.add(10);
      idx.add(20);
      idx.add(30);
      expect(idx.getPosition(10)).toBe(0);
      expect(idx.getPosition(20)).toBe(1);
      expect(idx.getPosition(30)).toBe(2);
    });

    test('getPosition skips excluded by default', () => {
      const idx = new OrderIndex<number>();
      idx.add(10);
      idx.add(20);
      idx.add(30);
      idx.exclude(20);
      expect(idx.getPosition(10)).toBe(0);
      expect(idx.getPosition(30)).toBe(1);
    });

    test('getPosition with includeExcluded counts excluded positions', () => {
      const idx = new OrderIndex<number>();
      idx.add(10);
      idx.add(20);
      idx.add(30);
      idx.exclude(20);
      expect(idx.getPosition(20, { includeExcluded: true })).toBe(1);
    });

    test('getPosition returns -1 for unknown id', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      expect(idx.getPosition(99)).toBe(-1);
    });
  });

  describe('stress / invariants', () => {
    test('maintains consistency across many add/remove cycles', () => {
      const idx = new OrderIndex<number>();
      for (let i = 0; i < 20; i++) {
        idx.add(i);
      }
      idx.remove(5);
      idx.remove(10);
      idx.remove(15);
      const arr = idx.toArray({ includeExcluded: true });
      expect(arr.length).toBe(17);
      expect(arr).toContain(0);
      expect(arr).toContain(19);
      expect(arr).not.toContain(5);

      const first = idx.first!;
      expect(idx.getPrev(first)).toBeNull();
      const last = idx.last!;
      expect(idx.getNext(last)).toBeNull();
    });

    test('exclude/include round trip preserves order and pointers', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.add(3);
      idx.exclude(2);
      idx.include(2, 1);
      expect(idx.toArray()).toEqual([1, 2, 3]);
      expect(idx.getNext(1)).toBe(2);
      expect(idx.getNext(2)).toBe(3);
      expect(idx.getPrev(2)).toBe(1);
    });

    test('all-excluded index: toArray empty, first/last null', () => {
      const idx = new OrderIndex<number>();
      idx.add(1);
      idx.add(2);
      idx.exclude(1);
      idx.exclude(2);
      expect(idx.toArray()).toEqual([]);
      expect(idx.first).toBeNull();
      expect(idx.last).toBeNull();
      expect(idx.getNext(1, { skipExcluded: true })).toBeNull();
    });
  });
});
