export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  /** Execute the pending invocation immediately and clear the timer. No-op when idle. */
  flush: () => void;
  /** Discard the pending invocation without executing it. */
  cancel: () => void;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    pendingArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      const currentArgs = pendingArgs;
      pendingArgs = null;
      if (currentArgs !== null) {
        func(...currentArgs);
      }
    }, wait);
  }) as DebouncedFunction<T>;

  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    const currentArgs = pendingArgs;
    pendingArgs = null;
    if (currentArgs !== null) {
      func(...currentArgs);
    }
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  return debounced;
}
