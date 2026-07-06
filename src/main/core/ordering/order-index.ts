export class OrderIndex<TId extends number | string> {
  private readonly _nodes: Map<TId, { prev: TId | null; next: TId | null }> = new Map();
  private _head: TId | null = null;
  private _tail: TId | null = null;
  private _firstActive: TId | null = null;
  private _lastActive: TId | null = null;
  private readonly _excluded: Set<TId> = new Set();

  add(id: TId, justAfter?: TId): void {
    if (this._nodes.has(id)) {
      return;
    }

    const insertAfter =
      justAfter !== undefined && this._nodes.has(justAfter) && !this._excluded.has(justAfter)
        ? justAfter
        : null;

    if (insertAfter !== null) {
      const afterNode = this._nodes.get(insertAfter)!;
      const newNode = { prev: insertAfter, next: afterNode.next };
      afterNode.next = id;
      if (newNode.next !== null) {
        this._nodes.get(newNode.next)!.prev = id;
      } else {
        this._tail = id;
      }
      this._nodes.set(id, newNode);
    } else {
      this._nodes.set(id, { prev: this._tail, next: null });
      if (this._tail !== null) {
        this._nodes.get(this._tail)!.next = id;
      } else {
        this._head = id;
      }
      this._tail = id;
    }

    if (this._firstActive === null) {
      this._firstActive = id;
    }
    if (this._tail === id) {
      this._lastActive = id;
    }
  }

  remove(id: TId): void {
    const node = this._nodes.get(id);
    if (!node) {
      return;
    }

    const prev = node.prev;
    const next = node.next;
    const wasExcluded = this._excluded.has(id);

    if (prev !== null) {
      this._nodes.get(prev)!.next = next;
    } else {
      this._head = next;
    }

    if (next !== null) {
      this._nodes.get(next)!.prev = prev;
    } else {
      this._tail = prev;
    }

    this._nodes.delete(id);
    this._excluded.delete(id);

    if (!wasExcluded) {
      if (this._firstActive === id) {
        this._firstActive = this._nextNonExcluded(next);
      }
      if (this._lastActive === id) {
        this._lastActive = this._prevNonExcluded(prev);
      }
    }
  }

  has(id: TId): boolean {
    return this._nodes.has(id);
  }

  isExcluded(id: TId): boolean {
    return this._excluded.has(id);
  }

  clear(): void {
    this._nodes.clear();
    this._excluded.clear();
    this._head = null;
    this._tail = null;
    this._firstActive = null;
    this._lastActive = null;
  }

  exclude(id: TId): void {
    if (!this._nodes.has(id) || this._excluded.has(id)) {
      return;
    }
    this._excluded.add(id);
    if (this._firstActive === id) {
      this._firstActive = this._nextNonExcluded(this._nodes.get(id)!.next);
    }
    if (this._lastActive === id) {
      this._lastActive = this._prevNonExcluded(this._nodes.get(id)!.prev);
    }
  }

  include(id: TId, justAfter?: TId): void {
    if (!this._nodes.has(id) || !this._excluded.has(id)) {
      return;
    }

    const needsMove =
      justAfter !== undefined && this._nodes.has(justAfter) && !this._excluded.has(justAfter);

    if (needsMove) {
      const node = this._nodes.get(id)!;
      const oldPrev = node.prev;
      const oldNext = node.next;

      if (oldPrev !== null) {
        this._nodes.get(oldPrev)!.next = oldNext;
      } else {
        this._head = oldNext;
      }
      if (oldNext !== null) {
        this._nodes.get(oldNext)!.prev = oldPrev;
      } else {
        this._tail = oldPrev;
      }

      const target = this._nodes.get(justAfter)!;
      node.prev = justAfter;
      node.next = target.next;
      target.next = id;
      if (node.next !== null) {
        this._nodes.get(node.next)!.prev = id;
      } else {
        this._tail = id;
      }
    }

    this._excluded.delete(id);
    this._firstActive = this._nextNonExcluded(this._head);
    this._lastActive = this._prevNonExcluded(this._tail);
  }

  getNext(id: TId, opts?: { skipExcluded?: boolean }): TId | null {
    const node = this._nodes.get(id);
    if (!node) {
      return null;
    }
    return opts?.skipExcluded ? this._nextNonExcluded(node.next) : node.next;
  }

  getPrev(id: TId, opts?: { skipExcluded?: boolean }): TId | null {
    const node = this._nodes.get(id);
    if (!node) {
      return null;
    }
    return opts?.skipExcluded ? this._prevNonExcluded(node.prev) : node.prev;
  }

  moveAfter(id: TId, targetId: TId): void {
    if (id === targetId || !this._nodes.has(id) || !this._nodes.has(targetId)) {
      return;
    }
    const wasExcluded = this._excluded.has(id);
    const targetNode = this._nodes.get(targetId)!;
    const nextOfTarget = targetNode.next;
    this.remove(id);
    this._nodes.set(id, { prev: targetId, next: nextOfTarget });
    this._nodes.get(targetId)!.next = id;
    if (nextOfTarget !== null) {
      this._nodes.get(nextOfTarget)!.prev = id;
    } else {
      this._tail = id;
    }
    if (wasExcluded) {
      this._excluded.add(id);
    }
    this._firstActive = this._nextNonExcluded(this._head);
    this._lastActive = this._prevNonExcluded(this._tail);
  }

  moveBefore(id: TId, targetId: TId): void {
    if (id === targetId || !this._nodes.has(id) || !this._nodes.has(targetId)) {
      return;
    }
    const wasExcluded = this._excluded.has(id);
    const targetNode = this._nodes.get(targetId)!;
    const prevOfTarget = targetNode.prev;
    // Degenerate: id is already the physical predecessor of targetId, so
    // the move is a no-op. Bail out before remove() to avoid corrupting
    // the linked list.
    if (prevOfTarget === id) {
      return;
    }
    this.remove(id);
    if (prevOfTarget === null) {
      this._nodes.set(id, { prev: null, next: targetId });
      this._nodes.get(targetId)!.prev = id;
      this._head = id;
      if (!wasExcluded) {
        this._firstActive = id;
      }
    } else {
      this._nodes.set(id, { prev: prevOfTarget, next: targetId });
      this._nodes.get(prevOfTarget)!.next = id;
      this._nodes.get(targetId)!.prev = id;
    }
    if (wasExcluded) {
      this._excluded.add(id);
    }
    this._firstActive = this._nextNonExcluded(this._head);
    this._lastActive = this._prevNonExcluded(this._tail);
  }

  move(id: TId, direction: 'up' | 'down', opts?: { skipExcluded?: boolean }): void {
    const skip = opts?.skipExcluded ?? false;
    if (direction === 'up') {
      const prev = this.getPrev(id, { skipExcluded: skip });
      if (prev === null) {
        return;
      }
      this.moveBefore(id, prev);
    } else {
      const next = this.getNext(id, { skipExcluded: skip });
      if (next === null) {
        return;
      }
      this.moveAfter(id, next);
    }
  }

  toArray(opts?: { includeExcluded?: boolean }): TId[] {
    const includeExcluded = opts?.includeExcluded ?? false;
    const result: TId[] = [];
    let current: TId | null = this._head;
    while (current !== null) {
      if (includeExcluded || !this._excluded.has(current)) {
        result.push(current);
      }
      current = this._nodes.get(current)!.next;
    }
    return result;
  }

  getPosition(id: TId, opts?: { includeExcluded?: boolean }): number {
    const includeExcluded = opts?.includeExcluded ?? false;
    let pos = 0;
    let current: TId | null = this._head;
    while (current !== null) {
      if (current === id) {
        return pos;
      }
      if (includeExcluded || !this._excluded.has(current)) {
        pos++;
      }
      current = this._nodes.get(current)!.next;
    }
    return -1;
  }

  get size(): number {
    return this._nodes.size;
  }

  get activeSize(): number {
    return this._nodes.size - this._excluded.size;
  }

  get first(): TId | null {
    return this._firstActive;
  }

  get last(): TId | null {
    return this._lastActive;
  }

  private _nextNonExcluded(start: TId | null): TId | null {
    let current = start;
    while (current !== null && this._excluded.has(current)) {
      current = this._nodes.get(current)!.next;
    }
    return current;
  }

  private _prevNonExcluded(start: TId | null): TId | null {
    let current = start;
    while (current !== null && this._excluded.has(current)) {
      current = this._nodes.get(current)!.prev;
    }
    return current;
  }
}
